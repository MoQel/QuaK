// Generated from backend/src/main/resources/OpenQASM3Parser.g4 by ANTLR 4.13.1
package edu.kit.quak.parser.qasm;

import org.antlr.v4.runtime.tree.ParseTreeListener;

/**
 * This interface defines a complete listener for a parse tree produced by
 * {@link OpenQASM3Parser}.
 */
public interface OpenQASM3ParserListener extends ParseTreeListener {
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#program}.
	 * @param ctx the parse tree
	 */
	void enterProgram(OpenQASM3Parser.ProgramContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#program}.
	 * @param ctx the parse tree
	 */
	void exitProgram(OpenQASM3Parser.ProgramContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#version}.
	 * @param ctx the parse tree
	 */
	void enterVersion(OpenQASM3Parser.VersionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#version}.
	 * @param ctx the parse tree
	 */
	void exitVersion(OpenQASM3Parser.VersionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#statement}.
	 * @param ctx the parse tree
	 */
	void enterStatement(OpenQASM3Parser.StatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#statement}.
	 * @param ctx the parse tree
	 */
	void exitStatement(OpenQASM3Parser.StatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#annotation}.
	 * @param ctx the parse tree
	 */
	void enterAnnotation(OpenQASM3Parser.AnnotationContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#annotation}.
	 * @param ctx the parse tree
	 */
	void exitAnnotation(OpenQASM3Parser.AnnotationContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#scope}.
	 * @param ctx the parse tree
	 */
	void enterScope(OpenQASM3Parser.ScopeContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#scope}.
	 * @param ctx the parse tree
	 */
	void exitScope(OpenQASM3Parser.ScopeContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#pragma}.
	 * @param ctx the parse tree
	 */
	void enterPragma(OpenQASM3Parser.PragmaContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#pragma}.
	 * @param ctx the parse tree
	 */
	void exitPragma(OpenQASM3Parser.PragmaContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#statementOrScope}.
	 * @param ctx the parse tree
	 */
	void enterStatementOrScope(OpenQASM3Parser.StatementOrScopeContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#statementOrScope}.
	 * @param ctx the parse tree
	 */
	void exitStatementOrScope(OpenQASM3Parser.StatementOrScopeContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#calibrationGrammarStatement}.
	 * @param ctx the parse tree
	 */
	void enterCalibrationGrammarStatement(OpenQASM3Parser.CalibrationGrammarStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#calibrationGrammarStatement}.
	 * @param ctx the parse tree
	 */
	void exitCalibrationGrammarStatement(OpenQASM3Parser.CalibrationGrammarStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#includeStatement}.
	 * @param ctx the parse tree
	 */
	void enterIncludeStatement(OpenQASM3Parser.IncludeStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#includeStatement}.
	 * @param ctx the parse tree
	 */
	void exitIncludeStatement(OpenQASM3Parser.IncludeStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#breakStatement}.
	 * @param ctx the parse tree
	 */
	void enterBreakStatement(OpenQASM3Parser.BreakStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#breakStatement}.
	 * @param ctx the parse tree
	 */
	void exitBreakStatement(OpenQASM3Parser.BreakStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#continueStatement}.
	 * @param ctx the parse tree
	 */
	void enterContinueStatement(OpenQASM3Parser.ContinueStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#continueStatement}.
	 * @param ctx the parse tree
	 */
	void exitContinueStatement(OpenQASM3Parser.ContinueStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#endStatement}.
	 * @param ctx the parse tree
	 */
	void enterEndStatement(OpenQASM3Parser.EndStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#endStatement}.
	 * @param ctx the parse tree
	 */
	void exitEndStatement(OpenQASM3Parser.EndStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#forStatement}.
	 * @param ctx the parse tree
	 */
	void enterForStatement(OpenQASM3Parser.ForStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#forStatement}.
	 * @param ctx the parse tree
	 */
	void exitForStatement(OpenQASM3Parser.ForStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#ifStatement}.
	 * @param ctx the parse tree
	 */
	void enterIfStatement(OpenQASM3Parser.IfStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#ifStatement}.
	 * @param ctx the parse tree
	 */
	void exitIfStatement(OpenQASM3Parser.IfStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#returnStatement}.
	 * @param ctx the parse tree
	 */
	void enterReturnStatement(OpenQASM3Parser.ReturnStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#returnStatement}.
	 * @param ctx the parse tree
	 */
	void exitReturnStatement(OpenQASM3Parser.ReturnStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#whileStatement}.
	 * @param ctx the parse tree
	 */
	void enterWhileStatement(OpenQASM3Parser.WhileStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#whileStatement}.
	 * @param ctx the parse tree
	 */
	void exitWhileStatement(OpenQASM3Parser.WhileStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#switchStatement}.
	 * @param ctx the parse tree
	 */
	void enterSwitchStatement(OpenQASM3Parser.SwitchStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#switchStatement}.
	 * @param ctx the parse tree
	 */
	void exitSwitchStatement(OpenQASM3Parser.SwitchStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#switchCaseItem}.
	 * @param ctx the parse tree
	 */
	void enterSwitchCaseItem(OpenQASM3Parser.SwitchCaseItemContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#switchCaseItem}.
	 * @param ctx the parse tree
	 */
	void exitSwitchCaseItem(OpenQASM3Parser.SwitchCaseItemContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#barrierStatement}.
	 * @param ctx the parse tree
	 */
	void enterBarrierStatement(OpenQASM3Parser.BarrierStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#barrierStatement}.
	 * @param ctx the parse tree
	 */
	void exitBarrierStatement(OpenQASM3Parser.BarrierStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#boxStatement}.
	 * @param ctx the parse tree
	 */
	void enterBoxStatement(OpenQASM3Parser.BoxStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#boxStatement}.
	 * @param ctx the parse tree
	 */
	void exitBoxStatement(OpenQASM3Parser.BoxStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#delayStatement}.
	 * @param ctx the parse tree
	 */
	void enterDelayStatement(OpenQASM3Parser.DelayStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#delayStatement}.
	 * @param ctx the parse tree
	 */
	void exitDelayStatement(OpenQASM3Parser.DelayStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#nopStatement}.
	 * @param ctx the parse tree
	 */
	void enterNopStatement(OpenQASM3Parser.NopStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#nopStatement}.
	 * @param ctx the parse tree
	 */
	void exitNopStatement(OpenQASM3Parser.NopStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#gateCallStatement}.
	 * @param ctx the parse tree
	 */
	void enterGateCallStatement(OpenQASM3Parser.GateCallStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#gateCallStatement}.
	 * @param ctx the parse tree
	 */
	void exitGateCallStatement(OpenQASM3Parser.GateCallStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#measureArrowAssignmentStatement}.
	 * @param ctx the parse tree
	 */
	void enterMeasureArrowAssignmentStatement(OpenQASM3Parser.MeasureArrowAssignmentStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#measureArrowAssignmentStatement}.
	 * @param ctx the parse tree
	 */
	void exitMeasureArrowAssignmentStatement(OpenQASM3Parser.MeasureArrowAssignmentStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#resetStatement}.
	 * @param ctx the parse tree
	 */
	void enterResetStatement(OpenQASM3Parser.ResetStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#resetStatement}.
	 * @param ctx the parse tree
	 */
	void exitResetStatement(OpenQASM3Parser.ResetStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#aliasDeclarationStatement}.
	 * @param ctx the parse tree
	 */
	void enterAliasDeclarationStatement(OpenQASM3Parser.AliasDeclarationStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#aliasDeclarationStatement}.
	 * @param ctx the parse tree
	 */
	void exitAliasDeclarationStatement(OpenQASM3Parser.AliasDeclarationStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#classicalDeclarationStatement}.
	 * @param ctx the parse tree
	 */
	void enterClassicalDeclarationStatement(OpenQASM3Parser.ClassicalDeclarationStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#classicalDeclarationStatement}.
	 * @param ctx the parse tree
	 */
	void exitClassicalDeclarationStatement(OpenQASM3Parser.ClassicalDeclarationStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#constDeclarationStatement}.
	 * @param ctx the parse tree
	 */
	void enterConstDeclarationStatement(OpenQASM3Parser.ConstDeclarationStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#constDeclarationStatement}.
	 * @param ctx the parse tree
	 */
	void exitConstDeclarationStatement(OpenQASM3Parser.ConstDeclarationStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#ioDeclarationStatement}.
	 * @param ctx the parse tree
	 */
	void enterIoDeclarationStatement(OpenQASM3Parser.IoDeclarationStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#ioDeclarationStatement}.
	 * @param ctx the parse tree
	 */
	void exitIoDeclarationStatement(OpenQASM3Parser.IoDeclarationStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#oldStyleDeclarationStatement}.
	 * @param ctx the parse tree
	 */
	void enterOldStyleDeclarationStatement(OpenQASM3Parser.OldStyleDeclarationStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#oldStyleDeclarationStatement}.
	 * @param ctx the parse tree
	 */
	void exitOldStyleDeclarationStatement(OpenQASM3Parser.OldStyleDeclarationStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#quantumDeclarationStatement}.
	 * @param ctx the parse tree
	 */
	void enterQuantumDeclarationStatement(OpenQASM3Parser.QuantumDeclarationStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#quantumDeclarationStatement}.
	 * @param ctx the parse tree
	 */
	void exitQuantumDeclarationStatement(OpenQASM3Parser.QuantumDeclarationStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#defStatement}.
	 * @param ctx the parse tree
	 */
	void enterDefStatement(OpenQASM3Parser.DefStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#defStatement}.
	 * @param ctx the parse tree
	 */
	void exitDefStatement(OpenQASM3Parser.DefStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#externStatement}.
	 * @param ctx the parse tree
	 */
	void enterExternStatement(OpenQASM3Parser.ExternStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#externStatement}.
	 * @param ctx the parse tree
	 */
	void exitExternStatement(OpenQASM3Parser.ExternStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#gateStatement}.
	 * @param ctx the parse tree
	 */
	void enterGateStatement(OpenQASM3Parser.GateStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#gateStatement}.
	 * @param ctx the parse tree
	 */
	void exitGateStatement(OpenQASM3Parser.GateStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#assignmentStatement}.
	 * @param ctx the parse tree
	 */
	void enterAssignmentStatement(OpenQASM3Parser.AssignmentStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#assignmentStatement}.
	 * @param ctx the parse tree
	 */
	void exitAssignmentStatement(OpenQASM3Parser.AssignmentStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#expressionStatement}.
	 * @param ctx the parse tree
	 */
	void enterExpressionStatement(OpenQASM3Parser.ExpressionStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#expressionStatement}.
	 * @param ctx the parse tree
	 */
	void exitExpressionStatement(OpenQASM3Parser.ExpressionStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#calStatement}.
	 * @param ctx the parse tree
	 */
	void enterCalStatement(OpenQASM3Parser.CalStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#calStatement}.
	 * @param ctx the parse tree
	 */
	void exitCalStatement(OpenQASM3Parser.CalStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#defcalStatement}.
	 * @param ctx the parse tree
	 */
	void enterDefcalStatement(OpenQASM3Parser.DefcalStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#defcalStatement}.
	 * @param ctx the parse tree
	 */
	void exitDefcalStatement(OpenQASM3Parser.DefcalStatementContext ctx);
	/**
	 * Enter a parse tree produced by the {@code bitwiseXorExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void enterBitwiseXorExpression(OpenQASM3Parser.BitwiseXorExpressionContext ctx);
	/**
	 * Exit a parse tree produced by the {@code bitwiseXorExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void exitBitwiseXorExpression(OpenQASM3Parser.BitwiseXorExpressionContext ctx);
	/**
	 * Enter a parse tree produced by the {@code additiveExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void enterAdditiveExpression(OpenQASM3Parser.AdditiveExpressionContext ctx);
	/**
	 * Exit a parse tree produced by the {@code additiveExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void exitAdditiveExpression(OpenQASM3Parser.AdditiveExpressionContext ctx);
	/**
	 * Enter a parse tree produced by the {@code durationofExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void enterDurationofExpression(OpenQASM3Parser.DurationofExpressionContext ctx);
	/**
	 * Exit a parse tree produced by the {@code durationofExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void exitDurationofExpression(OpenQASM3Parser.DurationofExpressionContext ctx);
	/**
	 * Enter a parse tree produced by the {@code parenthesisExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void enterParenthesisExpression(OpenQASM3Parser.ParenthesisExpressionContext ctx);
	/**
	 * Exit a parse tree produced by the {@code parenthesisExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void exitParenthesisExpression(OpenQASM3Parser.ParenthesisExpressionContext ctx);
	/**
	 * Enter a parse tree produced by the {@code comparisonExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void enterComparisonExpression(OpenQASM3Parser.ComparisonExpressionContext ctx);
	/**
	 * Exit a parse tree produced by the {@code comparisonExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void exitComparisonExpression(OpenQASM3Parser.ComparisonExpressionContext ctx);
	/**
	 * Enter a parse tree produced by the {@code multiplicativeExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void enterMultiplicativeExpression(OpenQASM3Parser.MultiplicativeExpressionContext ctx);
	/**
	 * Exit a parse tree produced by the {@code multiplicativeExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void exitMultiplicativeExpression(OpenQASM3Parser.MultiplicativeExpressionContext ctx);
	/**
	 * Enter a parse tree produced by the {@code logicalOrExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void enterLogicalOrExpression(OpenQASM3Parser.LogicalOrExpressionContext ctx);
	/**
	 * Exit a parse tree produced by the {@code logicalOrExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void exitLogicalOrExpression(OpenQASM3Parser.LogicalOrExpressionContext ctx);
	/**
	 * Enter a parse tree produced by the {@code castExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void enterCastExpression(OpenQASM3Parser.CastExpressionContext ctx);
	/**
	 * Exit a parse tree produced by the {@code castExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void exitCastExpression(OpenQASM3Parser.CastExpressionContext ctx);
	/**
	 * Enter a parse tree produced by the {@code powerExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void enterPowerExpression(OpenQASM3Parser.PowerExpressionContext ctx);
	/**
	 * Exit a parse tree produced by the {@code powerExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void exitPowerExpression(OpenQASM3Parser.PowerExpressionContext ctx);
	/**
	 * Enter a parse tree produced by the {@code bitwiseOrExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void enterBitwiseOrExpression(OpenQASM3Parser.BitwiseOrExpressionContext ctx);
	/**
	 * Exit a parse tree produced by the {@code bitwiseOrExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void exitBitwiseOrExpression(OpenQASM3Parser.BitwiseOrExpressionContext ctx);
	/**
	 * Enter a parse tree produced by the {@code callExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void enterCallExpression(OpenQASM3Parser.CallExpressionContext ctx);
	/**
	 * Exit a parse tree produced by the {@code callExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void exitCallExpression(OpenQASM3Parser.CallExpressionContext ctx);
	/**
	 * Enter a parse tree produced by the {@code bitshiftExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void enterBitshiftExpression(OpenQASM3Parser.BitshiftExpressionContext ctx);
	/**
	 * Exit a parse tree produced by the {@code bitshiftExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void exitBitshiftExpression(OpenQASM3Parser.BitshiftExpressionContext ctx);
	/**
	 * Enter a parse tree produced by the {@code bitwiseAndExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void enterBitwiseAndExpression(OpenQASM3Parser.BitwiseAndExpressionContext ctx);
	/**
	 * Exit a parse tree produced by the {@code bitwiseAndExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void exitBitwiseAndExpression(OpenQASM3Parser.BitwiseAndExpressionContext ctx);
	/**
	 * Enter a parse tree produced by the {@code equalityExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void enterEqualityExpression(OpenQASM3Parser.EqualityExpressionContext ctx);
	/**
	 * Exit a parse tree produced by the {@code equalityExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void exitEqualityExpression(OpenQASM3Parser.EqualityExpressionContext ctx);
	/**
	 * Enter a parse tree produced by the {@code logicalAndExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void enterLogicalAndExpression(OpenQASM3Parser.LogicalAndExpressionContext ctx);
	/**
	 * Exit a parse tree produced by the {@code logicalAndExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void exitLogicalAndExpression(OpenQASM3Parser.LogicalAndExpressionContext ctx);
	/**
	 * Enter a parse tree produced by the {@code indexExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void enterIndexExpression(OpenQASM3Parser.IndexExpressionContext ctx);
	/**
	 * Exit a parse tree produced by the {@code indexExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void exitIndexExpression(OpenQASM3Parser.IndexExpressionContext ctx);
	/**
	 * Enter a parse tree produced by the {@code unaryExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void enterUnaryExpression(OpenQASM3Parser.UnaryExpressionContext ctx);
	/**
	 * Exit a parse tree produced by the {@code unaryExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void exitUnaryExpression(OpenQASM3Parser.UnaryExpressionContext ctx);
	/**
	 * Enter a parse tree produced by the {@code literalExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void enterLiteralExpression(OpenQASM3Parser.LiteralExpressionContext ctx);
	/**
	 * Exit a parse tree produced by the {@code literalExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 */
	void exitLiteralExpression(OpenQASM3Parser.LiteralExpressionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#aliasExpression}.
	 * @param ctx the parse tree
	 */
	void enterAliasExpression(OpenQASM3Parser.AliasExpressionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#aliasExpression}.
	 * @param ctx the parse tree
	 */
	void exitAliasExpression(OpenQASM3Parser.AliasExpressionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#declarationExpression}.
	 * @param ctx the parse tree
	 */
	void enterDeclarationExpression(OpenQASM3Parser.DeclarationExpressionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#declarationExpression}.
	 * @param ctx the parse tree
	 */
	void exitDeclarationExpression(OpenQASM3Parser.DeclarationExpressionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#measureExpression}.
	 * @param ctx the parse tree
	 */
	void enterMeasureExpression(OpenQASM3Parser.MeasureExpressionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#measureExpression}.
	 * @param ctx the parse tree
	 */
	void exitMeasureExpression(OpenQASM3Parser.MeasureExpressionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#quantumCallExpression}.
	 * @param ctx the parse tree
	 */
	void enterQuantumCallExpression(OpenQASM3Parser.QuantumCallExpressionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#quantumCallExpression}.
	 * @param ctx the parse tree
	 */
	void exitQuantumCallExpression(OpenQASM3Parser.QuantumCallExpressionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#rangeExpression}.
	 * @param ctx the parse tree
	 */
	void enterRangeExpression(OpenQASM3Parser.RangeExpressionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#rangeExpression}.
	 * @param ctx the parse tree
	 */
	void exitRangeExpression(OpenQASM3Parser.RangeExpressionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#setExpression}.
	 * @param ctx the parse tree
	 */
	void enterSetExpression(OpenQASM3Parser.SetExpressionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#setExpression}.
	 * @param ctx the parse tree
	 */
	void exitSetExpression(OpenQASM3Parser.SetExpressionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#arrayLiteral}.
	 * @param ctx the parse tree
	 */
	void enterArrayLiteral(OpenQASM3Parser.ArrayLiteralContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#arrayLiteral}.
	 * @param ctx the parse tree
	 */
	void exitArrayLiteral(OpenQASM3Parser.ArrayLiteralContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#indexOperator}.
	 * @param ctx the parse tree
	 */
	void enterIndexOperator(OpenQASM3Parser.IndexOperatorContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#indexOperator}.
	 * @param ctx the parse tree
	 */
	void exitIndexOperator(OpenQASM3Parser.IndexOperatorContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#indexedIdentifier}.
	 * @param ctx the parse tree
	 */
	void enterIndexedIdentifier(OpenQASM3Parser.IndexedIdentifierContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#indexedIdentifier}.
	 * @param ctx the parse tree
	 */
	void exitIndexedIdentifier(OpenQASM3Parser.IndexedIdentifierContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#returnSignature}.
	 * @param ctx the parse tree
	 */
	void enterReturnSignature(OpenQASM3Parser.ReturnSignatureContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#returnSignature}.
	 * @param ctx the parse tree
	 */
	void exitReturnSignature(OpenQASM3Parser.ReturnSignatureContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#gateModifier}.
	 * @param ctx the parse tree
	 */
	void enterGateModifier(OpenQASM3Parser.GateModifierContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#gateModifier}.
	 * @param ctx the parse tree
	 */
	void exitGateModifier(OpenQASM3Parser.GateModifierContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#scalarType}.
	 * @param ctx the parse tree
	 */
	void enterScalarType(OpenQASM3Parser.ScalarTypeContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#scalarType}.
	 * @param ctx the parse tree
	 */
	void exitScalarType(OpenQASM3Parser.ScalarTypeContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#qubitType}.
	 * @param ctx the parse tree
	 */
	void enterQubitType(OpenQASM3Parser.QubitTypeContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#qubitType}.
	 * @param ctx the parse tree
	 */
	void exitQubitType(OpenQASM3Parser.QubitTypeContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#arrayType}.
	 * @param ctx the parse tree
	 */
	void enterArrayType(OpenQASM3Parser.ArrayTypeContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#arrayType}.
	 * @param ctx the parse tree
	 */
	void exitArrayType(OpenQASM3Parser.ArrayTypeContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#arrayReferenceType}.
	 * @param ctx the parse tree
	 */
	void enterArrayReferenceType(OpenQASM3Parser.ArrayReferenceTypeContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#arrayReferenceType}.
	 * @param ctx the parse tree
	 */
	void exitArrayReferenceType(OpenQASM3Parser.ArrayReferenceTypeContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#designator}.
	 * @param ctx the parse tree
	 */
	void enterDesignator(OpenQASM3Parser.DesignatorContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#designator}.
	 * @param ctx the parse tree
	 */
	void exitDesignator(OpenQASM3Parser.DesignatorContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#defcalTarget}.
	 * @param ctx the parse tree
	 */
	void enterDefcalTarget(OpenQASM3Parser.DefcalTargetContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#defcalTarget}.
	 * @param ctx the parse tree
	 */
	void exitDefcalTarget(OpenQASM3Parser.DefcalTargetContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#defcalArgumentDefinition}.
	 * @param ctx the parse tree
	 */
	void enterDefcalArgumentDefinition(OpenQASM3Parser.DefcalArgumentDefinitionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#defcalArgumentDefinition}.
	 * @param ctx the parse tree
	 */
	void exitDefcalArgumentDefinition(OpenQASM3Parser.DefcalArgumentDefinitionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#defcalOperand}.
	 * @param ctx the parse tree
	 */
	void enterDefcalOperand(OpenQASM3Parser.DefcalOperandContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#defcalOperand}.
	 * @param ctx the parse tree
	 */
	void exitDefcalOperand(OpenQASM3Parser.DefcalOperandContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#gateOperand}.
	 * @param ctx the parse tree
	 */
	void enterGateOperand(OpenQASM3Parser.GateOperandContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#gateOperand}.
	 * @param ctx the parse tree
	 */
	void exitGateOperand(OpenQASM3Parser.GateOperandContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#externArgument}.
	 * @param ctx the parse tree
	 */
	void enterExternArgument(OpenQASM3Parser.ExternArgumentContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#externArgument}.
	 * @param ctx the parse tree
	 */
	void exitExternArgument(OpenQASM3Parser.ExternArgumentContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#argumentDefinition}.
	 * @param ctx the parse tree
	 */
	void enterArgumentDefinition(OpenQASM3Parser.ArgumentDefinitionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#argumentDefinition}.
	 * @param ctx the parse tree
	 */
	void exitArgumentDefinition(OpenQASM3Parser.ArgumentDefinitionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#argumentDefinitionList}.
	 * @param ctx the parse tree
	 */
	void enterArgumentDefinitionList(OpenQASM3Parser.ArgumentDefinitionListContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#argumentDefinitionList}.
	 * @param ctx the parse tree
	 */
	void exitArgumentDefinitionList(OpenQASM3Parser.ArgumentDefinitionListContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#defcalArgumentDefinitionList}.
	 * @param ctx the parse tree
	 */
	void enterDefcalArgumentDefinitionList(OpenQASM3Parser.DefcalArgumentDefinitionListContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#defcalArgumentDefinitionList}.
	 * @param ctx the parse tree
	 */
	void exitDefcalArgumentDefinitionList(OpenQASM3Parser.DefcalArgumentDefinitionListContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#defcalOperandList}.
	 * @param ctx the parse tree
	 */
	void enterDefcalOperandList(OpenQASM3Parser.DefcalOperandListContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#defcalOperandList}.
	 * @param ctx the parse tree
	 */
	void exitDefcalOperandList(OpenQASM3Parser.DefcalOperandListContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#expressionList}.
	 * @param ctx the parse tree
	 */
	void enterExpressionList(OpenQASM3Parser.ExpressionListContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#expressionList}.
	 * @param ctx the parse tree
	 */
	void exitExpressionList(OpenQASM3Parser.ExpressionListContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#identifierList}.
	 * @param ctx the parse tree
	 */
	void enterIdentifierList(OpenQASM3Parser.IdentifierListContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#identifierList}.
	 * @param ctx the parse tree
	 */
	void exitIdentifierList(OpenQASM3Parser.IdentifierListContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#gateOperandList}.
	 * @param ctx the parse tree
	 */
	void enterGateOperandList(OpenQASM3Parser.GateOperandListContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#gateOperandList}.
	 * @param ctx the parse tree
	 */
	void exitGateOperandList(OpenQASM3Parser.GateOperandListContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenQASM3Parser#externArgumentList}.
	 * @param ctx the parse tree
	 */
	void enterExternArgumentList(OpenQASM3Parser.ExternArgumentListContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenQASM3Parser#externArgumentList}.
	 * @param ctx the parse tree
	 */
	void exitExternArgumentList(OpenQASM3Parser.ExternArgumentListContext ctx);
}