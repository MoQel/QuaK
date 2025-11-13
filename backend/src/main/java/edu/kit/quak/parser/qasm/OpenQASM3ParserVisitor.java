// Generated from backend/src/main/resources/OpenQASM3Parser.g4 by ANTLR 4.13.1
package edu.kit.quak.parser.qasm;

import org.antlr.v4.runtime.tree.ParseTreeVisitor;

/**
 * This interface defines a complete generic visitor for a parse tree produced
 * by {@link OpenQASM3Parser}.
 *
 * @param <T> The return type of the visit operation. Use {@link Void} for
 * operations with no return type.
 */
public interface OpenQASM3ParserVisitor<T> extends ParseTreeVisitor<T> {
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#program}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitProgram(OpenQASM3Parser.ProgramContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#version}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitVersion(OpenQASM3Parser.VersionContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#statement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitStatement(OpenQASM3Parser.StatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#annotation}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitAnnotation(OpenQASM3Parser.AnnotationContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#scope}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitScope(OpenQASM3Parser.ScopeContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#pragma}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitPragma(OpenQASM3Parser.PragmaContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#statementOrScope}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitStatementOrScope(OpenQASM3Parser.StatementOrScopeContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#calibrationGrammarStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitCalibrationGrammarStatement(OpenQASM3Parser.CalibrationGrammarStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#includeStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitIncludeStatement(OpenQASM3Parser.IncludeStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#breakStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitBreakStatement(OpenQASM3Parser.BreakStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#continueStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitContinueStatement(OpenQASM3Parser.ContinueStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#endStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitEndStatement(OpenQASM3Parser.EndStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#forStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitForStatement(OpenQASM3Parser.ForStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#ifStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitIfStatement(OpenQASM3Parser.IfStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#returnStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitReturnStatement(OpenQASM3Parser.ReturnStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#whileStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitWhileStatement(OpenQASM3Parser.WhileStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#switchStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitSwitchStatement(OpenQASM3Parser.SwitchStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#switchCaseItem}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitSwitchCaseItem(OpenQASM3Parser.SwitchCaseItemContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#barrierStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitBarrierStatement(OpenQASM3Parser.BarrierStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#boxStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitBoxStatement(OpenQASM3Parser.BoxStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#delayStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitDelayStatement(OpenQASM3Parser.DelayStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#nopStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitNopStatement(OpenQASM3Parser.NopStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#gateCallStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitGateCallStatement(OpenQASM3Parser.GateCallStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#measureArrowAssignmentStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitMeasureArrowAssignmentStatement(OpenQASM3Parser.MeasureArrowAssignmentStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#resetStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitResetStatement(OpenQASM3Parser.ResetStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#aliasDeclarationStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitAliasDeclarationStatement(OpenQASM3Parser.AliasDeclarationStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#classicalDeclarationStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitClassicalDeclarationStatement(OpenQASM3Parser.ClassicalDeclarationStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#constDeclarationStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitConstDeclarationStatement(OpenQASM3Parser.ConstDeclarationStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#ioDeclarationStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitIoDeclarationStatement(OpenQASM3Parser.IoDeclarationStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#oldStyleDeclarationStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitOldStyleDeclarationStatement(OpenQASM3Parser.OldStyleDeclarationStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#quantumDeclarationStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitQuantumDeclarationStatement(OpenQASM3Parser.QuantumDeclarationStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#defStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitDefStatement(OpenQASM3Parser.DefStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#externStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitExternStatement(OpenQASM3Parser.ExternStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#gateStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitGateStatement(OpenQASM3Parser.GateStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#assignmentStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitAssignmentStatement(OpenQASM3Parser.AssignmentStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#expressionStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitExpressionStatement(OpenQASM3Parser.ExpressionStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#calStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitCalStatement(OpenQASM3Parser.CalStatementContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#defcalStatement}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitDefcalStatement(OpenQASM3Parser.DefcalStatementContext ctx);
	/**
	 * Visit a parse tree produced by the {@code bitwiseXorExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitBitwiseXorExpression(OpenQASM3Parser.BitwiseXorExpressionContext ctx);
	/**
	 * Visit a parse tree produced by the {@code additiveExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitAdditiveExpression(OpenQASM3Parser.AdditiveExpressionContext ctx);
	/**
	 * Visit a parse tree produced by the {@code durationofExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitDurationofExpression(OpenQASM3Parser.DurationofExpressionContext ctx);
	/**
	 * Visit a parse tree produced by the {@code parenthesisExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitParenthesisExpression(OpenQASM3Parser.ParenthesisExpressionContext ctx);
	/**
	 * Visit a parse tree produced by the {@code comparisonExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitComparisonExpression(OpenQASM3Parser.ComparisonExpressionContext ctx);
	/**
	 * Visit a parse tree produced by the {@code multiplicativeExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitMultiplicativeExpression(OpenQASM3Parser.MultiplicativeExpressionContext ctx);
	/**
	 * Visit a parse tree produced by the {@code logicalOrExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitLogicalOrExpression(OpenQASM3Parser.LogicalOrExpressionContext ctx);
	/**
	 * Visit a parse tree produced by the {@code castExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitCastExpression(OpenQASM3Parser.CastExpressionContext ctx);
	/**
	 * Visit a parse tree produced by the {@code powerExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitPowerExpression(OpenQASM3Parser.PowerExpressionContext ctx);
	/**
	 * Visit a parse tree produced by the {@code bitwiseOrExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitBitwiseOrExpression(OpenQASM3Parser.BitwiseOrExpressionContext ctx);
	/**
	 * Visit a parse tree produced by the {@code callExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitCallExpression(OpenQASM3Parser.CallExpressionContext ctx);
	/**
	 * Visit a parse tree produced by the {@code bitshiftExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitBitshiftExpression(OpenQASM3Parser.BitshiftExpressionContext ctx);
	/**
	 * Visit a parse tree produced by the {@code bitwiseAndExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitBitwiseAndExpression(OpenQASM3Parser.BitwiseAndExpressionContext ctx);
	/**
	 * Visit a parse tree produced by the {@code equalityExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitEqualityExpression(OpenQASM3Parser.EqualityExpressionContext ctx);
	/**
	 * Visit a parse tree produced by the {@code logicalAndExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitLogicalAndExpression(OpenQASM3Parser.LogicalAndExpressionContext ctx);
	/**
	 * Visit a parse tree produced by the {@code indexExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitIndexExpression(OpenQASM3Parser.IndexExpressionContext ctx);
	/**
	 * Visit a parse tree produced by the {@code unaryExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitUnaryExpression(OpenQASM3Parser.UnaryExpressionContext ctx);
	/**
	 * Visit a parse tree produced by the {@code literalExpression}
	 * labeled alternative in {@link OpenQASM3Parser#expression}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitLiteralExpression(OpenQASM3Parser.LiteralExpressionContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#aliasExpression}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitAliasExpression(OpenQASM3Parser.AliasExpressionContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#declarationExpression}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitDeclarationExpression(OpenQASM3Parser.DeclarationExpressionContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#measureExpression}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitMeasureExpression(OpenQASM3Parser.MeasureExpressionContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#quantumCallExpression}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitQuantumCallExpression(OpenQASM3Parser.QuantumCallExpressionContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#rangeExpression}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitRangeExpression(OpenQASM3Parser.RangeExpressionContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#setExpression}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitSetExpression(OpenQASM3Parser.SetExpressionContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#arrayLiteral}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitArrayLiteral(OpenQASM3Parser.ArrayLiteralContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#indexOperator}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitIndexOperator(OpenQASM3Parser.IndexOperatorContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#indexedIdentifier}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitIndexedIdentifier(OpenQASM3Parser.IndexedIdentifierContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#returnSignature}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitReturnSignature(OpenQASM3Parser.ReturnSignatureContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#gateModifier}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitGateModifier(OpenQASM3Parser.GateModifierContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#scalarType}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitScalarType(OpenQASM3Parser.ScalarTypeContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#qubitType}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitQubitType(OpenQASM3Parser.QubitTypeContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#arrayType}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitArrayType(OpenQASM3Parser.ArrayTypeContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#arrayReferenceType}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitArrayReferenceType(OpenQASM3Parser.ArrayReferenceTypeContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#designator}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitDesignator(OpenQASM3Parser.DesignatorContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#defcalTarget}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitDefcalTarget(OpenQASM3Parser.DefcalTargetContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#defcalArgumentDefinition}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitDefcalArgumentDefinition(OpenQASM3Parser.DefcalArgumentDefinitionContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#defcalOperand}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitDefcalOperand(OpenQASM3Parser.DefcalOperandContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#gateOperand}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitGateOperand(OpenQASM3Parser.GateOperandContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#externArgument}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitExternArgument(OpenQASM3Parser.ExternArgumentContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#argumentDefinition}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitArgumentDefinition(OpenQASM3Parser.ArgumentDefinitionContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#argumentDefinitionList}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitArgumentDefinitionList(OpenQASM3Parser.ArgumentDefinitionListContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#defcalArgumentDefinitionList}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitDefcalArgumentDefinitionList(OpenQASM3Parser.DefcalArgumentDefinitionListContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#defcalOperandList}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitDefcalOperandList(OpenQASM3Parser.DefcalOperandListContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#expressionList}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitExpressionList(OpenQASM3Parser.ExpressionListContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#identifierList}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitIdentifierList(OpenQASM3Parser.IdentifierListContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#gateOperandList}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitGateOperandList(OpenQASM3Parser.GateOperandListContext ctx);
	/**
	 * Visit a parse tree produced by {@link OpenQASM3Parser#externArgumentList}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitExternArgumentList(OpenQASM3Parser.ExternArgumentListContext ctx);
}