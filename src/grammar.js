var sys = require('sys'),
    Parser = require('jison').Parser,
    typegrammar = require('./typegrammar').bnf;

var grammar = {
    "startSymbol": "program",

    "operators": [
        ["left", "RIGHTARROW", "LEFTARROW", "RIGHTFATARROW", "ELEM", "NOTELEM",
          "FORALL", "COMPOSE"],
        ["right", "IF", "ELSE"],
        ["left", "BOOLOP"],
        ["left", "COMPARE", "WITH"],
        ["left", "+", "-", "!"],
        ["left", "MATH", "CONCAT"],
        ["left", "."]
    ],

    "bnf": {
        "program": [
            ["EOF", "return [];"],
            ["body EOF", "return $1;"]
        ],
        "body": [
            ["line", "$$ = [$1];"],
            ["body TERMINATOR line", "$$ = $1; $1.push($3);"],
            ["body TERMINATOR", "$$ = $1;"]
        ],
        "line": [
            ["statement", "$$ = $1;"],
            ["expression", "$$ = $1;"],
            ["COMMENT", "$$ = new yy.Comment($1);"]
        ],
        "block": [
            ["INDENT body outdentOrEof", "$$ = $2;"]
        ],
        "doBody": [
            ["doLine", "$$ = [$1];"],
            ["doBody TERMINATOR doLine", "$$ = $1; $1.push($3);"],
            ["doBody TERMINATOR", "$$ = $1;"]
        ],
        "doLine": [
            ["line", "$$ = $1;"],
            ["IDENTIFIER LEFTARROW expression", "$$ = new yy.Bind($1, $3);"],
            ["RETURN expression", "$$ = new yy.Return($2);"]
        ],
        "doBlock": [
            ["INDENT doBody outdentOrEof", "$$ = $2;"]
        ],
        "statement": [
            ["letFunction", "$$ = $1;"],
            ["letBinding", "$$ = $1;"],
            ["dataDecl", "$$ = $1;"],
            ["typeDecl", "$$ = $1;"],
            ["macro", "$$ = $1;"]
        ],
        "expression": [
            ["innerExpression", "$$ = $1;"],
            ["LAMBDA paramList optType RIGHTARROW expression", "$$ = new yy.Function(undefined, $2, [$5], $3);"],
            ["LAMBDA paramList optType RIGHTARROW block", "$$ = new yy.Function(undefined, $2, $5, $3);"],
            ["MATCH innerExpression INDENT caseList outdentOrEof", "$$ = new yy.Match($2, $4);"],
            ["DO innerExpression doBlock", "$$ = new yy.Do($2, $3);"],
            ["ifThenElse", "$$ = $1;"]
        ],
        "callArgument": [
            ["( expression )", "$$ = new yy.Expression($2);"],
            ["& ( expression )", "$$ = new yy.Replacement($3);"],
            ["[| expression |]", "$$ = new yy.Quoted($2);"],
            ["accessor", "$$ = $1;"],
            ["callArgument ! callArgument", "$$ = new yy.Access($1, $3);"],
            ["callArgument MATH callArgument", "$$ = new yy.BinaryNumberOperator($2, $1, $3);"],
            ["callArgument CONCAT callArgument", "$$ = new yy.BinaryStringOperator($2, $1, $3);"],
            ["callArgument + callArgument", "$$ = new yy.BinaryNumberOperator($2, $1, $3);"],
            ["callArgument - callArgument", "$$ = new yy.BinaryNumberOperator($2, $1, $3);"],
            ["callArgument BOOLOP callArgument", "$$ = new yy.BinaryBooleanOperator($2, $1, $3);"],
            ["callArgument COMPARE callArgument", "$$ = new yy.BinaryGenericOperator($2, $1, $3);"],
            ["callArgument WITH callArgument", "$$ = new yy.With($1, $3);"],
            ["literal", "$$ = $1;"]
        ],
        "innerExpression": [
            ["call", "$$ = $1;"],
            ["callArgument", "$$ = $1;"]
        ],
        "caseList": [
            ["CASE pattern = expression", "$$ = [new yy.Case($2, $4)];"],
            ["caseList TERMINATOR CASE pattern = expression", "$$ = $1; $1.push(new yy.Case($4, $6));"]
        ],
        "pattern": [
            ["innerPattern", "$$ = $1;"],
            ["identifier", "$$ = new yy.Pattern($1, []);"]
        ],
        "innerPattern": [
            ["( identifier patternIdentifiers )", "$$ = new yy.Pattern($2, $3);"]
        ],
        "patternIdentifiers": [
            ["identifier", "$$ = [$1];"],
            ["innerPattern", "$$ = [$1];"],
            ["patternIdentifiers innerPattern", "$$ = $1; $1.push($2);"],
            ["patternIdentifiers identifier", "$$ = $1; $1.push($2);"]
        ],
        "ifThenElse": [
            ["IF innerExpression THEN block TERMINATOR ELSE block", "$$ = new yy.IfThenElse($2, $4, $7);"],
            ["IF innerExpression THEN innerExpression ELSE innerExpression", "$$ = new yy.IfThenElse($2, [$4], [$6]);"]
        ],

        // data Maybe a = Some a | None
        "dataDecl": [
            ["DATA IDENTIFIER optDataParamList = dataList", "$$ = new yy.Data($2, $3, $5);"],
            ["DATA IDENTIFIER optDataParamList = INDENT dataList outdentOrEof", "$$ = new yy.Data($2, $3, $6);"]
        ],
        "dataList": [
            ["IDENTIFIER optTypeParamList", "$$ = [new yy.Tag($1, $2)];"],
            ["dataList | IDENTIFIER optTypeParamList", "$$ = $1; $1.push(new yy.Tag($3, $4));"]
        ],

        // type Person = {firstName: String, lastName: String}
        "typeDecl": [
            ["TYPE IDENTIFIER = type", "$$ = new yy.Type($2, $4);"]
        ],

        // For type annotations (from the typegrammar module)
        "type": typegrammar.type,
        "typeList": typegrammar.typeList,
        "optTypeParamList": typegrammar.optTypeParamList,
        "typeParamList": typegrammar.typeParamList,
        "optTypeFunctionArgList": typegrammar.optTypeFunctionArgList,
        "typeFunctionArgList": typegrammar.typeFunctionArgList,
        "optTypePairs": typegrammar.optTypePairs,
        "dataParamList": typegrammar.dataParamList,
        "optDataParamList": typegrammar.optDataParamList,

        "macro": [
            ["MACRO IDENTIFIER = expression", "$$ = new yy.Macro($2, [$4]);"],
            ["MACRO IDENTIFIER = block", "$$ = new yy.Macro($2, $4);"]
        ],
        "letFunction": [
            ["LET IDENTIFIER paramList optType = block optWhere", "$$ = new yy.Function($2, $3, $6, $4, $7);"],
            ["LET IDENTIFIER paramList optType = expression", "$$ = new yy.Function($2, $3, [$6], $4, []);"]
        ],
        "letBinding": [
            ["LET IDENTIFIER optType = expression", "$$ = new yy.Let($2, $5, $3);"],
            ["LET IDENTIFIER optType = INDENT expression outdentOrEof", "$$ = new yy.Let($2, $6, $3);"]
        ],
        "paramList": [
            ["( )", "$$ = [];"],
            ["param", "$$ = [$1];"],
            ["paramList ( )", "$$ = $1;"],
            ["paramList param", "$$ = $1; $1.push($2);"]
        ],
        "param": [
            ["IDENTIFIER", "$$ = new yy.Arg($1);"],
            ["( IDENTIFIER : type )", "$$ = new yy.Arg($2, $4);"]
        ],
        "optType": [
            ["", ""],
            [": type", "$$ = $2"]
        ],
        "optWhere": [
            ["", "$$ = [];"],
            ["WHERE INDENT whereDecls outdentOrEof", "$$ = $3;"] 
        ],
        "whereDecls": [
            ["whereDecl", "$$ = [$1];"],
            ["whereDecls TERMINATOR whereDecl", "$$ = $1; $1.push($3);"]
        ],
        "whereDecl": [
            ["dataDecl", "$$ = $1;"],
            ["IDENTIFIER paramList optType = block optWhere", "$$ = new yy.Function($1, $2, $5, $3, $6);"],
            ["IDENTIFIER paramList optType = expression", "$$ = new yy.Function($1, $2, [$5], $3, []);"]
        ],

        "call": [
            ["accessor argList", "$$ = new yy.Call($1, $2);"],
            ["( expression ) argList", "$$ = new yy.Call($2, $4);"]
        ],
        "argList": [
            ["( )", "$$ = [];"],
            ["callArgument", "$$ = [$1];"],
            ["argList ( )", "$$ = $1;"],
            ["argList callArgument", "$$ = $1; $1.push($2);"]
        ],
        "tuple": [
            ["( innerExpression , tupleList )", "$4.unshift($2); $$ = new yy.Tuple($4);"]
        ],
        "tupleList": [
            ["innerExpression", "$$ = [$1];"],
            ["tupleList , innerExpression", "$$ = $1; $1.push($3);"]
        ],
        "literal": [
            ["NUMBER", "$$ = new yy.Number($1);"],
            ["STRING", "$$ = new yy.String($1);"],
            ["BOOLEAN", "$$ = new yy.Boolean($1);"],
            ["tuple", "$$ = $1;"],
            ["[ optValues ]", "$$ = new yy.Array($2);"],
            ["{ optPairs }", "$$ = new yy.Object($2);"]
        ],
        "optValues": [
            ["", "$$ = [];"],
            ["arrayValues", "$$ = $1;"]
        ],
        "arrayValues": [
            ["expression", "$$ = [$1];"],
            ["arrayValues , expression", "$$ = $1; $1.push($3);"]
        ],
        "optPairs": [
            ["", "$$ = {};"],
            ["INDENT keyPairs OUTDENT TERMINATOR", "$$ = $2;"],
            ["keyPairs", "$$ = $1;"]
        ],
        "keyPairs": [
            ["keywordOrIdentifier : expression", "$$ = {}; $$[$1] = $3;"],
            ["keyPairs , keywordOrIdentifier : expression", "$$ = $1; $1[$3] = $5;"],
            ["keyPairs TERMINATOR optTerm keywordOrIdentifier : expression", "$$ = $1; $1[$4] = $6;"]
        ],
        "optTerm": [
            ["", ""],
            ["TERMINATOR", ""]
        ],
        "accessor": [
            ["IDENTIFIER", "$$ = new yy.Identifier($1);"],
            ["accessor . keywordOrIdentifier", "$$ = new yy.PropertyAccess($1, $3);"],
            ["( expression ) . keywordOrIdentifier", "$$ = new yy.PropertyAccess($2, $5);"]
        ],
        "outdentOrEof": [
            ["OUTDENT", ""],
            ["EOF", ""]
        ],
        "keywordOrIdentifier": typegrammar.keywordOrIdentifier,
        "identifier": [
            ["IDENTIFIER", "$$ = new yy.Identifier($1);"]
        ]
    }
};

var parser = new Parser(grammar, {debug: true});

var fs = require('fs');
fs.writeFile('src/parser.js', parser.generate());
