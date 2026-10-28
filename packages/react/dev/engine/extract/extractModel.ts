import path from "node:path";
import ts from "typescript";
import type { Child } from "../Interfaces/ComponentModel/Child";
import type { ComponentModel } from "../Interfaces/ComponentModel/ComponentModel";
import type { Expr } from "../Interfaces/ComponentModel/Expr";
import type { HookCall } from "../Interfaces/ComponentModel/HookCall";
import type { Local } from "../Interfaces/ComponentModel/Local";
import type { Param } from "../Interfaces/ComponentModel/Param";
import type { Prop } from "../Interfaces/ComponentModel/Prop";
import type { Reference } from "../Interfaces/ComponentModel/Reference";
import type { Return } from "../Interfaces/ComponentModel/Return";
import type { Static } from "../Interfaces/ComponentModel/Static";
import type { TreeElement } from "../Interfaces/ComponentModel/TreeElement";
import type { Wrapper } from "../Interfaces/ComponentModel/Wrapper";

/** Syntax the extractor met and could not record as written. It is listed, never skipped silently. */
export type Unsupported = { kind: string; source: string };
export type Extraction = {
  model: ComponentModel;
  unsupported: Unsupported[];
  /** The source text each element was read from, by element id: kept to check that the model says what was written. */
  originals: Record<string, string>;
};

type FunctionNode = ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction;
type JsxNode = ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment;

const isFunctionNode = (node: ts.Node): node is FunctionNode => ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node);
const isJsx = (node: ts.Node): node is JsxNode => ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node);

/** `useState`, `React.useEffect`: a call to something named `use…`. */
const isHookCallee = (callee: ts.Expression): boolean => {
  const name = ts.isIdentifier(callee) ? callee.text : ts.isPropertyAccessExpression(callee) ? callee.name.text : "";
  return /^use[A-Z0-9]/.test(name);
};

/** The names a binding introduces: `on`, `[on, setOn]`, `{ a, b: c }`. */
function bindingNames(name: ts.BindingName): string[] {
  if (ts.isIdentifier(name)) return [name.text];
  return name.elements.flatMap((element) => (ts.isOmittedExpression(element) ? [] : bindingNames(element.name)));
}

/** JSX collapses text between tags: each line is trimmed, empty lines go, the rest is joined with a space. */
const jsxText = (text: string) =>
  text
    .split(/\r\n|\n|\r/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");

const TYPE_FLAGS = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;

export function createExtractor(program: ts.Program, root: string) {
  const checker = program.getTypeChecker();

  const idOf = (file: ts.SourceFile, name: string) => `${path.relative(root, file.fileName)}#${name}`;

  /** Where the component a symbol is is written, if it is a function at the top of a file in this project. */
  function declaredOfSymbol(symbol: ts.Symbol | undefined): string | undefined {
    if (symbol && symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
    // Only a declaration at the top of a file is a component this project defines; `const Component = as ?? "div"` inside a function is not.
    const declaration = symbol?.declarations?.find(
      (d) => (ts.isFunctionDeclaration(d) && ts.isSourceFile(d.parent)) || (ts.isVariableDeclaration(d) && ts.isSourceFile(d.parent.parent.parent)),
    );
    if (!declaration || declaration.getSourceFile().fileName.includes("node_modules")) return undefined;
    const name = ts.getNameOfDeclaration(declaration)?.getText();
    return name ? idOf(declaration.getSourceFile(), name) : undefined;
  }

  /** Where the component a tag names is written. */
  function declaredOf(tag: ts.Node): string | undefined {
    return ts.isIdentifier(tag) ? declaredOfSymbol(checker.getSymbolAtLocation(tag)) : undefined;
  }

  /** Where the component an expression is is written: a name (`ActionListItem`), or a member of another component (`Popover.Header`). */
  function declaredOfExpression(node: ts.Node): string | undefined {
    if (ts.isIdentifier(node)) return declaredOf(node);
    if (!ts.isPropertyAccessExpression(node)) return undefined;
    const member = checker.getSymbolAtLocation(node.name)?.declarations?.[0];
    if (member && ts.isPropertyAssignment(member)) return declaredOfExpression(member.initializer);
    if (member && ts.isShorthandPropertyAssignment(member)) return declaredOfSymbol(checker.getShorthandAssignmentValueSymbol(member));
    return undefined;
  }

  /** Where a name is imported from (`react`, `./Spinner`), for an identifier or the root of `React.memo`. */
  function importSource(node: ts.Expression): string | undefined {
    let root: ts.Expression = node;
    while (ts.isPropertyAccessExpression(root)) root = root.expression;
    if (!ts.isIdentifier(root)) return undefined;
    const declaration = checker.getSymbolAtLocation(root)?.declarations?.[0];
    const importDeclaration = declaration && ts.findAncestor(declaration, ts.isImportDeclaration);
    return importDeclaration && ts.isStringLiteral(importDeclaration.moduleSpecifier) ? importDeclaration.moduleSpecifier.text : undefined;
  }

  /** What a type looks like to a person: a union of literals spelled out, `boolean` for true | false. */
  function typeText(type: ts.Type): string {
    if (type.isUnion()) {
      const members = type.types.filter((t) => !(t.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null)));
      if (members.every((t) => t.flags & ts.TypeFlags.BooleanLiteral) && members.length === 2) return "boolean";
      if (members.every((t) => t.isStringLiteral() || t.isNumberLiteral())) return members.map((t) => (t.isStringLiteral() ? JSON.stringify(t.value) : String((t as ts.NumberLiteralType).value))).join(" | ");
      // One real type and `undefined` (an optional prop): the type itself, without the parentheses a union adds.
      if (members.length === 1) return checker.typeToString(members[0], undefined, TYPE_FLAGS);
    }
    return checker.typeToString(type, undefined, TYPE_FLAGS).replace(/ \| undefined$/, "");
  }

  /**
   * Finds the function behind a name in a file, and the nodes that wrap it (`memo(…)`) or attach to it (`Object.assign(…)`,
   * `Menu.Item = …`). They are nodes, not records, because turning them into records needs the function's own scope.
   */
  function locate(sourceFile: ts.SourceFile, name: string) {
    const wrapperCalls: ts.CallExpression[] = [];
    const staticNodes: { name: string; node: ts.Expression; how: string }[] = [];

    const declaration = (target: string): ts.Node | undefined => {
      for (const statement of sourceFile.statements) {
        if (ts.isFunctionDeclaration(statement) && statement.name?.text === target) return statement;
        if (ts.isVariableStatement(statement))
          for (const d of statement.declarationList.declarations) if (ts.isIdentifier(d.name) && d.name.text === target) return d;
      }
      return undefined;
    };

    /** Follows `memo(forwardRef(function …))` and `Object.assign(Root, { … })` down to the function. */
    const unwrap = (node: ts.Expression): FunctionNode | undefined => {
      let current = node;
      while (ts.isParenthesizedExpression(current) || ts.isAsExpression(current) || ts.isSatisfiesExpression(current)) current = current.expression;
      if (isFunctionNode(current)) return current;
      if (ts.isIdentifier(current)) {
        // By the checker, not by file: the component may be imported from another file (a barrel re-exporting `Object.assign(_Banner, …)`).
        let symbol = checker.getSymbolAtLocation(current);
        if (symbol && symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
        const target = symbol?.declarations?.find((d) => ts.isFunctionDeclaration(d) || (ts.isVariableDeclaration(d) && d.initializer));
        if (target && ts.isFunctionDeclaration(target)) return target;
        if (target && ts.isVariableDeclaration(target) && target.initializer) return unwrap(target.initializer);
        return undefined;
      }
      if (ts.isCallExpression(current)) {
        const [first, ...rest] = current.arguments;
        if (current.expression.getText() === "Object.assign" && first) {
          for (const arg of rest)
            if (ts.isObjectLiteralExpression(arg))
              for (const property of arg.properties) {
                if (ts.isPropertyAssignment(property)) staticNodes.push({ name: property.name.getText(), node: property.initializer, how: "Object.assign" });
                else if (ts.isShorthandPropertyAssignment(property)) staticNodes.push({ name: property.name.text, node: property.name, how: "Object.assign" });
              }
          return unwrap(first);
        }
        if (first) {
          wrapperCalls.push(current);
          return unwrap(first);
        }
      }
      return undefined;
    };

    let fn: FunctionNode | undefined;
    const target = declaration(name);
    if (target && ts.isFunctionDeclaration(target)) fn = target;
    else if (target && ts.isVariableDeclaration(target) && target.initializer) fn = unwrap(target.initializer);
    if (!fn) return null;

    // `Menu.Item = Item`
    const owner = fn.name?.getText() ?? name;
    for (const statement of sourceFile.statements) {
      if (!ts.isExpressionStatement(statement) || !ts.isBinaryExpression(statement.expression)) continue;
      const { left, right, operatorToken } = statement.expression;
      if (operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isPropertyAccessExpression(left) && [name, owner].includes(left.expression.getText()))
        staticNodes.push({ name: left.name.text, node: right, how: "assignment" });
    }
    return { fn, wrapperCalls, staticNodes };
  }

  function extract(sourceFile: ts.SourceFile, localName: string, exportedAs = localName): Extraction | null {
    const found = locate(sourceFile, localName);
    if (!found) return null;
    const { fn } = found;
    const home = fn.getSourceFile();
    const unsupported: Unsupported[] = [];
    const note = (kind: string, node: ts.Node) => unsupported.push({ kind, source: node.getText().slice(0, 120) });

    // Names the body introduces, so each reference can say where its name came from.
    const hookOf = new Map<ts.Symbol, string>();
    const bodyDeclared = new Set<ts.Symbol>();
    const paramDeclared = new Set<ts.Symbol>();
    const symbolOf = (node: ts.Node) => checker.getSymbolAtLocation(node);

    for (const parameter of fn.parameters) {
      const mark = (name: ts.BindingName) => {
        if (ts.isIdentifier(name)) {
          const symbol = symbolOf(name);
          if (symbol) paramDeclared.add(symbol);
        } else for (const element of name.elements) if (!ts.isOmittedExpression(element)) mark(element.name);
      };
      mark(parameter.name);
    }
    const markBody = (name: ts.BindingName, hook?: string) => {
      if (ts.isIdentifier(name)) {
        const symbol = symbolOf(name);
        if (!symbol) return;
        bodyDeclared.add(symbol);
        if (hook) hookOf.set(symbol, hook);
      } else for (const element of name.elements) if (!ts.isOmittedExpression(element)) markBody(element.name, hook);
    };
    const hookCallOf = (initializer: ts.Expression | undefined) => {
      let node = initializer;
      while (node && (ts.isParenthesizedExpression(node) || ts.isAsExpression(node))) node = node.expression;
      return node && ts.isCallExpression(node) && isHookCallee(node.expression) ? node : undefined;
    };
    const prescan = (statements: readonly ts.Statement[]) => {
      for (const statement of statements) {
        if (ts.isFunctionDeclaration(statement) && statement.name) markBody(statement.name);
        else if (ts.isVariableStatement(statement))
          for (const d of statement.declarationList.declarations) {
            const call = hookCallOf(d.initializer);
            markBody(d.name, call ? call.expression.getText() : undefined);
          }
        else if (ts.isBlock(statement)) prescan(statement.statements);
        else if (ts.isIfStatement(statement)) {
          prescan(ts.isBlock(statement.thenStatement) ? statement.thenStatement.statements : [statement.thenStatement]);
          if (statement.elseStatement) prescan(ts.isBlock(statement.elseStatement) ? statement.elseStatement.statements : [statement.elseStatement]);
        }
      }
    };
    if (fn.body && ts.isBlock(fn.body)) prescan(fn.body.statements);

    const originOf = (identifier: ts.Identifier, within: ts.Node): Reference["origin"] | "internal" => {
      const symbol = ts.isShorthandPropertyAssignment(identifier.parent) ? checker.getShorthandAssignmentValueSymbol(identifier.parent) : symbolOf(identifier);
      const declaration = symbol?.declarations?.[0];
      if (!symbol || !declaration) return { kind: "global" };
      const file = declaration.getSourceFile();
      if (program.isSourceFileDefaultLibrary(file) || file.fileName.includes("node_modules")) {
        const importDeclaration = ts.findAncestor(declaration, ts.isImportDeclaration);
        return importDeclaration && ts.isStringLiteral(importDeclaration.moduleSpecifier) ? { kind: "import", from: importDeclaration.moduleSpecifier.text } : { kind: "global" };
      }
      const importDeclaration = ts.findAncestor(declaration, ts.isImportDeclaration);
      if (importDeclaration && ts.isStringLiteral(importDeclaration.moduleSpecifier)) return { kind: "import", from: importDeclaration.moduleSpecifier.text };
      // Declared inside the expression itself (an inline function's own parameter): not a name the component brings in.
      if (declaration.pos >= within.pos && declaration.end <= within.end) return "internal";
      if (paramDeclared.has(symbol)) return { kind: "param" };
      const hook = hookOf.get(symbol);
      if (hook) return { kind: "hook", hook };
      if (bodyDeclared.has(symbol)) return { kind: "local" };
      // Declared somewhere else inside the function (a const in a nested block, a loop variable): still the body's own.
      return declaration.pos >= fn.pos && declaration.end <= fn.end ? { kind: "local" } : { kind: "module" };
    };

    /** Every name an expression uses, once each, with where it came from. */
    const readsOf = (node: ts.Node): Reference[] => {
      const reads: Reference[] = [];
      const seen = new Set<string>();
      const visit = (child: ts.Node) => {
        if (ts.isIdentifier(child) && isReference(child)) {
          const origin = originOf(child, node);
          if (origin !== "internal") {
            const key = `${child.text}|${JSON.stringify(origin)}`;
            if (!seen.has(key)) {
              seen.add(key);
              reads.push({ name: child.text, origin });
            }
          }
        }
        ts.forEachChild(child, visit);
      };
      visit(node);
      return reads;
    };

    const callsOf = (node: ts.Node): Local["calls"] => {
      const calls: Local["calls"] = [];
      const visit = (child: ts.Node) => {
        if (ts.isCallExpression(child)) calls.push({ callee: expr(child.expression), arguments: child.arguments.map((arg) => expr(arg)) });
        ts.forEachChild(child, visit);
      };
      visit(node);
      return calls;
    };

    const originals: Record<string, string> = {};
    const counts = new Map<string, number>();
    const idFor = (tag: string) => {
      const n = (counts.get(tag) ?? 0) + 1;
      counts.set(tag, n);
      return n === 1 ? tag : `${tag}-${n}`;
    };

    /** The outermost JSX written inside a node. */
    const elementsIn = (node: ts.Node): TreeElement[] => {
      const found: TreeElement[] = [];
      const visit = (child: ts.Node) => {
        if (isJsx(child)) found.push(element(child));
        else ts.forEachChild(child, visit);
      };
      ts.forEachChild(node, visit);
      if (isJsx(node)) return [element(node)];
      return found;
    };

    /** The properties of the object literals written in a node, by key, and the names read by the tests each sits under. */
    const propertiesIn = (node: ts.Node): Expr["properties"] => {
      const found: Expr["properties"] = [];
      const visit = (child: ts.Node, tests: ts.Node[]) => {
        if (ts.isConditionalExpression(child)) {
          visit(child.condition, tests);
          const under = [...tests, child.condition];
          visit(child.whenTrue, under);
          visit(child.whenFalse, under);
          return;
        }
        if (ts.isBinaryExpression(child) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(child.operatorToken.kind)) {
          visit(child.left, tests);
          visit(child.right, [...tests, child.left]);
          return;
        }
        if (ts.isObjectLiteralExpression(child))
          for (const property of child.properties) {
            if (ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property)) {
              const key = property.name.getText().replace(/^["']|["']$/g, "");
              found.push({ key, reads: readsOf(property), guards: tests.flatMap((test) => readsOf(test)) });
            }
          }
        ts.forEachChild(child, (inner) => visit(inner, tests));
      };
      visit(node, []);
      return found;
    };

    /** The conditionals written in a node: what each test reads and what each branch reads. */
    const branchesIn = (node: ts.Node): Expr["branches"] => {
      const found: Expr["branches"] = [];
      const visit = (child: ts.Node) => {
        if (ts.isConditionalExpression(child)) found.push({ test: readsOf(child.condition), consequent: readsOf(child.whenTrue), alternate: readsOf(child.whenFalse) });
        else if (ts.isBinaryExpression(child)) {
          const { kind } = child.operatorToken;
          if (kind === ts.SyntaxKind.AmpersandAmpersandToken) found.push({ test: readsOf(child.left), consequent: readsOf(child.right), alternate: [] });
          else if (kind === ts.SyntaxKind.BarBarToken || kind === ts.SyntaxKind.QuestionQuestionToken) found.push({ test: readsOf(child.left), consequent: [], alternate: readsOf(child.right) });
        }
        ts.forEachChild(child, visit);
      };
      visit(node);
      return found;
    };

    function expr(node: ts.Node): Expr {
      return { source: node.getText(), reads: readsOf(node), elements: elementsIn(node), properties: propertiesIn(node), branches: branchesIn(node) };
    }

    function element(node: JsxNode): TreeElement {
      const result = elementOf(node);
      originals[result.id] = node.getText();
      return result;
    }

    function elementOf(node: JsxNode): TreeElement {
      if (ts.isJsxFragment(node)) return { id: idFor("fragment"), type: { kind: "fragment" }, attributes: [], children: childrenOf(node.children) };
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      const tag = opening.tagName.getText();
      const host = /^[a-z]/.test(tag) && !tag.includes(".");
      const attributes: TreeElement["attributes"] = [];
      for (const attribute of opening.attributes.properties) {
        if (ts.isJsxSpreadAttribute(attribute)) {
          attributes.push({ kind: "spread", value: expr(attribute.expression) });
          continue;
        }
        const name = attribute.name.getText();
        const initializer = attribute.initializer;
        if (!initializer) attributes.push({ kind: "attribute", name });
        else if (ts.isStringLiteral(initializer)) attributes.push({ kind: "attribute", name, value: initializer.text });
        else if (ts.isJsxExpression(initializer) && initializer.expression) attributes.push({ kind: "attribute", name, value: expr(initializer.expression) });
        else {
          note("jsx-attribute-value", attribute);
          attributes.push({ kind: "attribute", name, value: { source: initializer.getText(), reads: [], elements: [], properties: [], branches: [] } });
        }
      }
      return {
        id: idFor(host ? tag : tag.split(".").pop() ?? tag),
        type: host ? { kind: "host", host: { tag } } : { kind: "component", name: tag, from: importSource(opening.tagName as ts.Expression), declared: declaredOf(opening.tagName) },
        attributes,
        children: ts.isJsxElement(node) ? childrenOf(node.children) : [],
      };
    }

    function childrenOf(nodes: ts.NodeArray<ts.JsxChild>): Child[] {
      const children: Child[] = [];
      for (const child of nodes) {
        if (ts.isJsxText(child)) {
          const text = jsxText(child.text);
          if (text) children.push({ kind: "text", text });
        } else if (ts.isJsxExpression(child)) {
          if (child.expression) children.push({ kind: "expression", expr: expr(child.expression) });
        } else children.push({ kind: "element", element: element(child) });
      }
      return children;
    }

    const valueOf = (node: ts.Expression): Child => {
      let inner: ts.Expression = node;
      while (ts.isParenthesizedExpression(inner)) inner = inner.expression;
      return isJsx(inner) ? { kind: "element", element: element(inner) } : { kind: "expression", expr: expr(node) };
    };

    const hooks: HookCall[] = [];
    const locals: Local[] = [];
    const returns: Return[] = [];

    const containsReturn = (node: ts.Node): boolean => {
      if (isFunctionNode(node)) return false;
      let found = false;
      const visit = (child: ts.Node) => {
        if (found || isFunctionNode(child)) return;
        if (ts.isReturnStatement(child)) found = true;
        else ts.forEachChild(child, visit);
      };
      ts.forEachChild(node, visit);
      return ts.isReturnStatement(node) || found;
    };

    const hookOfCall = (call: ts.CallExpression, binds: string[]): HookCall => ({
      hook: call.expression.getText(),
      from: importSource(call.expression),
      ...(declaredOfExpression(call.expression) ? { declared: declaredOfExpression(call.expression) } : {}),
      arguments: call.arguments.map((arg) => expr(arg)),
      binds,
    });

    const walk = (statements: readonly ts.Statement[], guards: Expr[]) => {
      for (const statement of statements) {
        if (ts.isReturnStatement(statement)) {
          if (statement.expression) returns.push({ guards, value: valueOf(statement.expression) });
          else returns.push({ guards, value: { kind: "expression", expr: { source: "undefined", reads: [], elements: [], properties: [], branches: [] } } });
        } else if (ts.isBlock(statement)) walk(statement.statements, guards);
        else if (ts.isIfStatement(statement) && containsReturn(statement)) {
          const test = expr(statement.expression);
          const branch = (s: ts.Statement, tests: Expr[]) => walk(ts.isBlock(s) ? s.statements : [s], tests);
          branch(statement.thenStatement, [...guards, test]);
          if (statement.elseStatement) branch(statement.elseStatement, [...guards, { ...test, source: `!(${test.source})` }]);
        } else if (ts.isSwitchStatement(statement) && containsReturn(statement)) {
          // Each case is read as an `if (discriminant === value)`; a default as the discriminant matching none, written as `default`.
          for (const clause of statement.caseBlock.clauses) {
            const source = ts.isCaseClause(clause) ? `${statement.expression.getText()} === ${clause.expression.getText()}` : `default of ${statement.expression.getText()}`;
            const reads = [...readsOf(statement.expression), ...(ts.isCaseClause(clause) ? readsOf(clause.expression) : [])];
            walk(clause.statements, [...guards, { source, reads, elements: [], properties: [], branches: [] }]);
          }
        } else if (containsReturn(statement)) {
          // A return inside a try or a loop: its path is not one of `if` tests.
          note("return-in-control-flow", statement);
          locals.push({ names: [], kind: "statement", source: statement.getText(), reads: readsOf(statement), calls: callsOf(statement) });
        } else if (ts.isVariableStatement(statement)) {
          for (const d of statement.declarationList.declarations) {
            const call = hookCallOf(d.initializer);
            if (call) hooks.push(hookOfCall(call, bindingNames(d.name)));
            else {
              const initializer = d.initializer;
              locals.push({
                names: bindingNames(d.name),
                kind: initializer && isFunctionNode(initializer) ? "function" : "value",
                source: d.getText(),
                reads: readsOf(d),
                calls: callsOf(d),
              });
            }
          }
        } else if (ts.isFunctionDeclaration(statement)) {
          locals.push({ names: statement.name ? [statement.name.text] : [], kind: "function", source: statement.getText(), reads: readsOf(statement), calls: callsOf(statement) });
        } else if (ts.isExpressionStatement(statement) && ts.isCallExpression(statement.expression) && isHookCallee(statement.expression.expression)) {
          hooks.push(hookOfCall(statement.expression, []));
        } else {
          locals.push({ names: [], kind: "statement", source: statement.getText(), reads: readsOf(statement), calls: callsOf(statement) });
        }
      }
    };

    if (fn.body && ts.isBlock(fn.body)) walk(fn.body.statements, []);
    else if (fn.body) returns.push({ guards: [], value: valueOf(fn.body) });

    // Parameters as written, and the type of the first one as the checker sees it.
    const params: Param[] = fn.parameters.map((parameter) => ({
      pattern: parameter.name.getText(),
      ...(parameter.type ? { type: parameter.type.getText() } : {}),
      bindings: ts.isObjectBindingPattern(parameter.name)
        ? parameter.name.elements.map((element) => ({
            name: element.name.getText(),
            ...(element.propertyName ? { key: element.propertyName.getText().replace(/^["']|["']$/g, "") } : {}),
            ...(element.initializer ? { default: element.initializer.getText() } : {}),
            ...(element.dotDotDotToken ? { rest: true } : {}),
          }))
        : [],
    }));

    const props: Prop[] = [];
    let inheritedProps = 0;
    const first = fn.parameters[0];
    if (first) {
      const type = checker.getTypeAtLocation(first);
      const defaults = new Map(params[0].bindings.filter((b) => b.default).map((b) => [b.name, b.default as string]));
      for (const symbol of checker.getPropertiesOfType(type)) {
        // A member can be declared twice (the DOM's `children` and the component's own): it is the project's if either is.
        const declaration = symbol.declarations?.find((d) => {
          const file = d.getSourceFile();
          return !program.isSourceFileDefaultLibrary(file) && !file.fileName.includes("node_modules");
        });
        if (!declaration) {
          if (!symbol.declarations?.length) continue;
          // Inherited from a library. Listed only if the parameter names it, so the model says what it is for.
          if (!params[0].bindings.some((b) => b.name === symbol.name && !b.rest)) {
            inheritedProps += 1;
            continue;
          }
          props.push({
            name: symbol.name,
            type: typeText(checker.getTypeOfSymbolAtLocation(symbol, first)),
            required: !(symbol.flags & ts.SymbolFlags.Optional),
            inherited: true,
            ...(defaults.get(symbol.name) ? { default: defaults.get(symbol.name) } : {}),
          });
          continue;
        }
        const doc = ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();
        const jsDefault = ts.getJSDocTags(declaration).find((tag) => tag.tagName.text === "default");
        const fromTag = jsDefault && typeof jsDefault.comment === "string" ? jsDefault.comment.trim() : undefined;
        const fallback = defaults.get(symbol.name) ?? fromTag;
        props.push({
          name: symbol.name,
          type: typeText(checker.getTypeOfSymbolAtLocation(symbol, first)),
          required: !(symbol.flags & ts.SymbolFlags.Optional),
          ...(fallback ? { default: fallback } : {}),
          ...(doc ? { doc } : {}),
        });
      }
    }

    // A component returns something; a hook that only runs effects (`useEscape`) legitimately does not.
    if (returns.length === 0 && /^[A-Z]/.test(localName)) note("no-return", fn);

    const wrappers: Wrapper[] = found.wrapperCalls.map((call) => ({
      name: call.expression.getText(),
      from: importSource(call.expression),
      arguments: call.arguments.slice(1).map((arg) => expr(arg)),
    }));
    const statics: Static[] = found.staticNodes.map(({ name, node, how }) => ({ name, value: expr(node), how, ...(declaredOfExpression(node) ? { declared: declaredOfExpression(node) } : {}) }));

    return {
      model: { name: exportedAs, declared: idOf(sourceFile, localName), wrappers, params, props, inheritedProps, hooks, locals, returns, statics },
      unsupported,
      originals,
    };
  }

  return { extract, program, checker };
}

/** Whether an identifier is a use of a name, as opposed to a property's name, an attribute's name or a declaration. */
function isReference(node: ts.Identifier): boolean {
  const parent = node.parent;
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) return false;
  if (ts.isPropertyAssignment(parent) && parent.name === node) return false;
  if (ts.isJsxAttribute(parent) && parent.name === node) return false;
  if (ts.isBindingElement(parent) && parent.propertyName === node) return false;
  if (ts.isPropertySignature(parent) || ts.isPropertyDeclaration(parent) || ts.isMethodDeclaration(parent)) return parent.name !== node;
  if (ts.isQualifiedName(parent) && parent.right === node) return false;
  if ((ts.isJsxOpeningElement(parent) || ts.isJsxSelfClosingElement(parent) || ts.isJsxClosingElement(parent)) && parent.tagName === node) return /^[A-Z]/.test(node.text);
  return true;
}
