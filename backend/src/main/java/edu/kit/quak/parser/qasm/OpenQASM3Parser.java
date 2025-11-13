// Generated from backend/src/main/resources/OpenQASM3Parser.g4 by ANTLR 4.13.1
package edu.kit.quak.parser.qasm;

import org.antlr.v4.runtime.atn.*;
import org.antlr.v4.runtime.dfa.DFA;
import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.misc.*;
import org.antlr.v4.runtime.tree.*;
import java.util.List;
import java.util.Iterator;
import java.util.ArrayList;

@SuppressWarnings({"all", "warnings", "unchecked", "unused", "cast", "CheckReturnValue"})
public class OpenQASM3Parser extends Parser {
	static { RuntimeMetaData.checkVersion("4.13.1", RuntimeMetaData.VERSION); }

	protected static final DFA[] _decisionToDFA;
	protected static final PredictionContextCache _sharedContextCache =
		new PredictionContextCache();
	public static final int
		OPENQASM=1, INCLUDE=2, DEFCALGRAMMAR=3, DEF=4, CAL=5, DEFCAL=6, GATE=7, 
		EXTERN=8, BOX=9, LET=10, BREAK=11, CONTINUE=12, IF=13, ELSE=14, END=15, 
		RETURN=16, FOR=17, WHILE=18, IN=19, SWITCH=20, CASE=21, DEFAULT=22, NOP=23, 
		PRAGMA=24, AnnotationKeyword=25, INPUT=26, OUTPUT=27, CONST=28, READONLY=29, 
		MUTABLE=30, QREG=31, QUBIT=32, CREG=33, BOOL=34, BIT=35, INT=36, UINT=37, 
		FLOAT=38, ANGLE=39, COMPLEX=40, ARRAY=41, VOID=42, DURATION=43, STRETCH=44, 
		GPHASE=45, INV=46, POW=47, CTRL=48, NEGCTRL=49, DIM=50, DURATIONOF=51, 
		DELAY=52, RESET=53, MEASURE=54, BARRIER=55, BooleanLiteral=56, LBRACKET=57, 
		RBRACKET=58, LBRACE=59, RBRACE=60, LPAREN=61, RPAREN=62, COLON=63, SEMICOLON=64, 
		DOT=65, COMMA=66, EQUALS=67, ARROW=68, PLUS=69, DOUBLE_PLUS=70, MINUS=71, 
		ASTERISK=72, DOUBLE_ASTERISK=73, SLASH=74, PERCENT=75, PIPE=76, DOUBLE_PIPE=77, 
		AMPERSAND=78, DOUBLE_AMPERSAND=79, CARET=80, AT=81, TILDE=82, EXCLAMATION_POINT=83, 
		EqualityOperator=84, CompoundAssignmentOperator=85, ComparisonOperator=86, 
		BitshiftOperator=87, IMAG=88, ImaginaryLiteral=89, BinaryIntegerLiteral=90, 
		OctalIntegerLiteral=91, DecimalIntegerLiteral=92, HexIntegerLiteral=93, 
		Identifier=94, HardwareQubit=95, FloatLiteral=96, TimingLiteral=97, BitstringLiteral=98, 
		Whitespace=99, Newline=100, LineComment=101, BlockComment=102, VERSION_IDENTIFER_WHITESPACE=103, 
		VersionSpecifier=104, ARBITRARY_STRING_WHITESPACE=105, StringLiteral=106, 
		EAT_INITIAL_SPACE=107, EAT_LINE_END=108, RemainingLineContent=109, CAL_PRELUDE_WHITESPACE=110, 
		CAL_PRELUDE_COMMENT=111, DEFCAL_PRELUDE_WHITESPACE=112, DEFCAL_PRELUDE_COMMENT=113, 
		CalibrationBlock=114;
	public static final int
		RULE_program = 0, RULE_version = 1, RULE_statement = 2, RULE_annotation = 3, 
		RULE_scope = 4, RULE_pragma = 5, RULE_statementOrScope = 6, RULE_calibrationGrammarStatement = 7, 
		RULE_includeStatement = 8, RULE_breakStatement = 9, RULE_continueStatement = 10, 
		RULE_endStatement = 11, RULE_forStatement = 12, RULE_ifStatement = 13, 
		RULE_returnStatement = 14, RULE_whileStatement = 15, RULE_switchStatement = 16, 
		RULE_switchCaseItem = 17, RULE_barrierStatement = 18, RULE_boxStatement = 19, 
		RULE_delayStatement = 20, RULE_nopStatement = 21, RULE_gateCallStatement = 22, 
		RULE_measureArrowAssignmentStatement = 23, RULE_resetStatement = 24, RULE_aliasDeclarationStatement = 25, 
		RULE_classicalDeclarationStatement = 26, RULE_constDeclarationStatement = 27, 
		RULE_ioDeclarationStatement = 28, RULE_oldStyleDeclarationStatement = 29, 
		RULE_quantumDeclarationStatement = 30, RULE_defStatement = 31, RULE_externStatement = 32, 
		RULE_gateStatement = 33, RULE_assignmentStatement = 34, RULE_expressionStatement = 35, 
		RULE_calStatement = 36, RULE_defcalStatement = 37, RULE_expression = 38, 
		RULE_aliasExpression = 39, RULE_declarationExpression = 40, RULE_measureExpression = 41, 
		RULE_quantumCallExpression = 42, RULE_rangeExpression = 43, RULE_setExpression = 44, 
		RULE_arrayLiteral = 45, RULE_indexOperator = 46, RULE_indexedIdentifier = 47, 
		RULE_returnSignature = 48, RULE_gateModifier = 49, RULE_scalarType = 50, 
		RULE_qubitType = 51, RULE_arrayType = 52, RULE_arrayReferenceType = 53, 
		RULE_designator = 54, RULE_defcalTarget = 55, RULE_defcalArgumentDefinition = 56, 
		RULE_defcalOperand = 57, RULE_gateOperand = 58, RULE_externArgument = 59, 
		RULE_argumentDefinition = 60, RULE_argumentDefinitionList = 61, RULE_defcalArgumentDefinitionList = 62, 
		RULE_defcalOperandList = 63, RULE_expressionList = 64, RULE_identifierList = 65, 
		RULE_gateOperandList = 66, RULE_externArgumentList = 67;
	private static String[] makeRuleNames() {
		return new String[] {
			"program", "version", "statement", "annotation", "scope", "pragma", "statementOrScope", 
			"calibrationGrammarStatement", "includeStatement", "breakStatement", 
			"continueStatement", "endStatement", "forStatement", "ifStatement", "returnStatement", 
			"whileStatement", "switchStatement", "switchCaseItem", "barrierStatement", 
			"boxStatement", "delayStatement", "nopStatement", "gateCallStatement", 
			"measureArrowAssignmentStatement", "resetStatement", "aliasDeclarationStatement", 
			"classicalDeclarationStatement", "constDeclarationStatement", "ioDeclarationStatement", 
			"oldStyleDeclarationStatement", "quantumDeclarationStatement", "defStatement", 
			"externStatement", "gateStatement", "assignmentStatement", "expressionStatement", 
			"calStatement", "defcalStatement", "expression", "aliasExpression", "declarationExpression", 
			"measureExpression", "quantumCallExpression", "rangeExpression", "setExpression", 
			"arrayLiteral", "indexOperator", "indexedIdentifier", "returnSignature", 
			"gateModifier", "scalarType", "qubitType", "arrayType", "arrayReferenceType", 
			"designator", "defcalTarget", "defcalArgumentDefinition", "defcalOperand", 
			"gateOperand", "externArgument", "argumentDefinition", "argumentDefinitionList", 
			"defcalArgumentDefinitionList", "defcalOperandList", "expressionList", 
			"identifierList", "gateOperandList", "externArgumentList"
		};
	}
	public static final String[] ruleNames = makeRuleNames();

	private static String[] makeLiteralNames() {
		return new String[] {
			null, "'OPENQASM'", "'include'", "'defcalgrammar'", "'def'", "'cal'", 
			"'defcal'", "'gate'", "'extern'", "'box'", "'let'", "'break'", "'continue'", 
			"'if'", "'else'", "'end'", "'return'", "'for'", "'while'", "'in'", "'switch'", 
			"'case'", "'default'", "'nop'", null, null, "'input'", "'output'", "'const'", 
			"'readonly'", "'mutable'", "'qreg'", "'qubit'", "'creg'", "'bool'", "'bit'", 
			"'int'", "'uint'", "'float'", "'angle'", "'complex'", "'array'", "'void'", 
			"'duration'", "'stretch'", "'gphase'", "'inv'", "'pow'", "'ctrl'", "'negctrl'", 
			"'#dim'", "'durationof'", "'delay'", "'reset'", "'measure'", "'barrier'", 
			null, "'['", "']'", "'{'", "'}'", "'('", "')'", "':'", "';'", "'.'", 
			"','", "'='", "'->'", "'+'", "'++'", "'-'", "'*'", "'**'", "'/'", "'%'", 
			"'|'", "'||'", "'&'", "'&&'", "'^'", "'@'", "'~'", "'!'", null, null, 
			null, null, "'im'"
		};
	}
	private static final String[] _LITERAL_NAMES = makeLiteralNames();
	private static String[] makeSymbolicNames() {
		return new String[] {
			null, "OPENQASM", "INCLUDE", "DEFCALGRAMMAR", "DEF", "CAL", "DEFCAL", 
			"GATE", "EXTERN", "BOX", "LET", "BREAK", "CONTINUE", "IF", "ELSE", "END", 
			"RETURN", "FOR", "WHILE", "IN", "SWITCH", "CASE", "DEFAULT", "NOP", "PRAGMA", 
			"AnnotationKeyword", "INPUT", "OUTPUT", "CONST", "READONLY", "MUTABLE", 
			"QREG", "QUBIT", "CREG", "BOOL", "BIT", "INT", "UINT", "FLOAT", "ANGLE", 
			"COMPLEX", "ARRAY", "VOID", "DURATION", "STRETCH", "GPHASE", "INV", "POW", 
			"CTRL", "NEGCTRL", "DIM", "DURATIONOF", "DELAY", "RESET", "MEASURE", 
			"BARRIER", "BooleanLiteral", "LBRACKET", "RBRACKET", "LBRACE", "RBRACE", 
			"LPAREN", "RPAREN", "COLON", "SEMICOLON", "DOT", "COMMA", "EQUALS", "ARROW", 
			"PLUS", "DOUBLE_PLUS", "MINUS", "ASTERISK", "DOUBLE_ASTERISK", "SLASH", 
			"PERCENT", "PIPE", "DOUBLE_PIPE", "AMPERSAND", "DOUBLE_AMPERSAND", "CARET", 
			"AT", "TILDE", "EXCLAMATION_POINT", "EqualityOperator", "CompoundAssignmentOperator", 
			"ComparisonOperator", "BitshiftOperator", "IMAG", "ImaginaryLiteral", 
			"BinaryIntegerLiteral", "OctalIntegerLiteral", "DecimalIntegerLiteral", 
			"HexIntegerLiteral", "Identifier", "HardwareQubit", "FloatLiteral", "TimingLiteral", 
			"BitstringLiteral", "Whitespace", "Newline", "LineComment", "BlockComment", 
			"VERSION_IDENTIFER_WHITESPACE", "VersionSpecifier", "ARBITRARY_STRING_WHITESPACE", 
			"StringLiteral", "EAT_INITIAL_SPACE", "EAT_LINE_END", "RemainingLineContent", 
			"CAL_PRELUDE_WHITESPACE", "CAL_PRELUDE_COMMENT", "DEFCAL_PRELUDE_WHITESPACE", 
			"DEFCAL_PRELUDE_COMMENT", "CalibrationBlock"
		};
	}
	private static final String[] _SYMBOLIC_NAMES = makeSymbolicNames();
	public static final Vocabulary VOCABULARY = new VocabularyImpl(_LITERAL_NAMES, _SYMBOLIC_NAMES);

	/**
	 * @deprecated Use {@link #VOCABULARY} instead.
	 */
	@Deprecated
	public static final String[] tokenNames;
	static {
		tokenNames = new String[_SYMBOLIC_NAMES.length];
		for (int i = 0; i < tokenNames.length; i++) {
			tokenNames[i] = VOCABULARY.getLiteralName(i);
			if (tokenNames[i] == null) {
				tokenNames[i] = VOCABULARY.getSymbolicName(i);
			}

			if (tokenNames[i] == null) {
				tokenNames[i] = "<INVALID>";
			}
		}
	}

	@Override
	@Deprecated
	public String[] getTokenNames() {
		return tokenNames;
	}

	@Override

	public Vocabulary getVocabulary() {
		return VOCABULARY;
	}

	@Override
	public String getGrammarFileName() { return "OpenQASM3Parser.g4"; }

	@Override
	public String[] getRuleNames() { return ruleNames; }

	@Override
	public String getSerializedATN() { return _serializedATN; }

	@Override
	public ATN getATN() { return _ATN; }

	public OpenQASM3Parser(TokenStream input) {
		super(input);
		_interp = new ParserATNSimulator(this,_ATN,_decisionToDFA,_sharedContextCache);
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ProgramContext extends ParserRuleContext {
		public TerminalNode EOF() { return getToken(OpenQASM3Parser.EOF, 0); }
		public VersionContext version() {
			return getRuleContext(VersionContext.class,0);
		}
		public List<StatementOrScopeContext> statementOrScope() {
			return getRuleContexts(StatementOrScopeContext.class);
		}
		public StatementOrScopeContext statementOrScope(int i) {
			return getRuleContext(StatementOrScopeContext.class,i);
		}
		public ProgramContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_program; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterProgram(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitProgram(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitProgram(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ProgramContext program() throws RecognitionException {
		ProgramContext _localctx = new ProgramContext(_ctx, getState());
		enterRule(_localctx, 0, RULE_program);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(137);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==OPENQASM) {
				{
				setState(136);
				version();
				}
			}

			setState(142);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while ((((_la) & ~0x3f) == 0 && ((1L << _la) & 3025288650022174716L) != 0) || ((((_la - 71)) & ~0x3f) == 0 && ((1L << (_la - 71)) & 268179457L) != 0)) {
				{
				{
				setState(139);
				statementOrScope();
				}
				}
				setState(144);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(145);
			match(EOF);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class VersionContext extends ParserRuleContext {
		public TerminalNode OPENQASM() { return getToken(OpenQASM3Parser.OPENQASM, 0); }
		public TerminalNode VersionSpecifier() { return getToken(OpenQASM3Parser.VersionSpecifier, 0); }
		public TerminalNode SEMICOLON() { return getToken(OpenQASM3Parser.SEMICOLON, 0); }
		public VersionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_version; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterVersion(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitVersion(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitVersion(this);
			else return visitor.visitChildren(this);
		}
	}

	public final VersionContext version() throws RecognitionException {
		VersionContext _localctx = new VersionContext(_ctx, getState());
		enterRule(_localctx, 2, RULE_version);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(147);
			match(OPENQASM);
			setState(148);
			match(VersionSpecifier);
			setState(149);
			match(SEMICOLON);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class StatementContext extends ParserRuleContext {
		public PragmaContext pragma() {
			return getRuleContext(PragmaContext.class,0);
		}
		public AliasDeclarationStatementContext aliasDeclarationStatement() {
			return getRuleContext(AliasDeclarationStatementContext.class,0);
		}
		public AssignmentStatementContext assignmentStatement() {
			return getRuleContext(AssignmentStatementContext.class,0);
		}
		public BarrierStatementContext barrierStatement() {
			return getRuleContext(BarrierStatementContext.class,0);
		}
		public BoxStatementContext boxStatement() {
			return getRuleContext(BoxStatementContext.class,0);
		}
		public BreakStatementContext breakStatement() {
			return getRuleContext(BreakStatementContext.class,0);
		}
		public CalStatementContext calStatement() {
			return getRuleContext(CalStatementContext.class,0);
		}
		public CalibrationGrammarStatementContext calibrationGrammarStatement() {
			return getRuleContext(CalibrationGrammarStatementContext.class,0);
		}
		public ClassicalDeclarationStatementContext classicalDeclarationStatement() {
			return getRuleContext(ClassicalDeclarationStatementContext.class,0);
		}
		public ConstDeclarationStatementContext constDeclarationStatement() {
			return getRuleContext(ConstDeclarationStatementContext.class,0);
		}
		public ContinueStatementContext continueStatement() {
			return getRuleContext(ContinueStatementContext.class,0);
		}
		public DefStatementContext defStatement() {
			return getRuleContext(DefStatementContext.class,0);
		}
		public DefcalStatementContext defcalStatement() {
			return getRuleContext(DefcalStatementContext.class,0);
		}
		public DelayStatementContext delayStatement() {
			return getRuleContext(DelayStatementContext.class,0);
		}
		public EndStatementContext endStatement() {
			return getRuleContext(EndStatementContext.class,0);
		}
		public ExpressionStatementContext expressionStatement() {
			return getRuleContext(ExpressionStatementContext.class,0);
		}
		public ExternStatementContext externStatement() {
			return getRuleContext(ExternStatementContext.class,0);
		}
		public ForStatementContext forStatement() {
			return getRuleContext(ForStatementContext.class,0);
		}
		public GateCallStatementContext gateCallStatement() {
			return getRuleContext(GateCallStatementContext.class,0);
		}
		public GateStatementContext gateStatement() {
			return getRuleContext(GateStatementContext.class,0);
		}
		public IfStatementContext ifStatement() {
			return getRuleContext(IfStatementContext.class,0);
		}
		public IncludeStatementContext includeStatement() {
			return getRuleContext(IncludeStatementContext.class,0);
		}
		public IoDeclarationStatementContext ioDeclarationStatement() {
			return getRuleContext(IoDeclarationStatementContext.class,0);
		}
		public MeasureArrowAssignmentStatementContext measureArrowAssignmentStatement() {
			return getRuleContext(MeasureArrowAssignmentStatementContext.class,0);
		}
		public NopStatementContext nopStatement() {
			return getRuleContext(NopStatementContext.class,0);
		}
		public OldStyleDeclarationStatementContext oldStyleDeclarationStatement() {
			return getRuleContext(OldStyleDeclarationStatementContext.class,0);
		}
		public QuantumDeclarationStatementContext quantumDeclarationStatement() {
			return getRuleContext(QuantumDeclarationStatementContext.class,0);
		}
		public ResetStatementContext resetStatement() {
			return getRuleContext(ResetStatementContext.class,0);
		}
		public ReturnStatementContext returnStatement() {
			return getRuleContext(ReturnStatementContext.class,0);
		}
		public SwitchStatementContext switchStatement() {
			return getRuleContext(SwitchStatementContext.class,0);
		}
		public WhileStatementContext whileStatement() {
			return getRuleContext(WhileStatementContext.class,0);
		}
		public List<AnnotationContext> annotation() {
			return getRuleContexts(AnnotationContext.class);
		}
		public AnnotationContext annotation(int i) {
			return getRuleContext(AnnotationContext.class,i);
		}
		public StatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_statement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final StatementContext statement() throws RecognitionException {
		StatementContext _localctx = new StatementContext(_ctx, getState());
		enterRule(_localctx, 4, RULE_statement);
		int _la;
		try {
			setState(190);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case PRAGMA:
				enterOuterAlt(_localctx, 1);
				{
				setState(151);
				pragma();
				}
				break;
			case INCLUDE:
			case DEFCALGRAMMAR:
			case DEF:
			case CAL:
			case DEFCAL:
			case GATE:
			case EXTERN:
			case BOX:
			case LET:
			case BREAK:
			case CONTINUE:
			case IF:
			case END:
			case RETURN:
			case FOR:
			case WHILE:
			case SWITCH:
			case NOP:
			case AnnotationKeyword:
			case INPUT:
			case OUTPUT:
			case CONST:
			case QREG:
			case QUBIT:
			case CREG:
			case BOOL:
			case BIT:
			case INT:
			case UINT:
			case FLOAT:
			case ANGLE:
			case COMPLEX:
			case ARRAY:
			case DURATION:
			case STRETCH:
			case GPHASE:
			case INV:
			case POW:
			case CTRL:
			case NEGCTRL:
			case DURATIONOF:
			case DELAY:
			case RESET:
			case MEASURE:
			case BARRIER:
			case BooleanLiteral:
			case LPAREN:
			case MINUS:
			case TILDE:
			case EXCLAMATION_POINT:
			case ImaginaryLiteral:
			case BinaryIntegerLiteral:
			case OctalIntegerLiteral:
			case DecimalIntegerLiteral:
			case HexIntegerLiteral:
			case Identifier:
			case HardwareQubit:
			case FloatLiteral:
			case TimingLiteral:
			case BitstringLiteral:
				enterOuterAlt(_localctx, 2);
				{
				setState(155);
				_errHandler.sync(this);
				_la = _input.LA(1);
				while (_la==AnnotationKeyword) {
					{
					{
					setState(152);
					annotation();
					}
					}
					setState(157);
					_errHandler.sync(this);
					_la = _input.LA(1);
				}
				setState(188);
				_errHandler.sync(this);
				switch ( getInterpreter().adaptivePredict(_input,3,_ctx) ) {
				case 1:
					{
					setState(158);
					aliasDeclarationStatement();
					}
					break;
				case 2:
					{
					setState(159);
					assignmentStatement();
					}
					break;
				case 3:
					{
					setState(160);
					barrierStatement();
					}
					break;
				case 4:
					{
					setState(161);
					boxStatement();
					}
					break;
				case 5:
					{
					setState(162);
					breakStatement();
					}
					break;
				case 6:
					{
					setState(163);
					calStatement();
					}
					break;
				case 7:
					{
					setState(164);
					calibrationGrammarStatement();
					}
					break;
				case 8:
					{
					setState(165);
					classicalDeclarationStatement();
					}
					break;
				case 9:
					{
					setState(166);
					constDeclarationStatement();
					}
					break;
				case 10:
					{
					setState(167);
					continueStatement();
					}
					break;
				case 11:
					{
					setState(168);
					defStatement();
					}
					break;
				case 12:
					{
					setState(169);
					defcalStatement();
					}
					break;
				case 13:
					{
					setState(170);
					delayStatement();
					}
					break;
				case 14:
					{
					setState(171);
					endStatement();
					}
					break;
				case 15:
					{
					setState(172);
					expressionStatement();
					}
					break;
				case 16:
					{
					setState(173);
					externStatement();
					}
					break;
				case 17:
					{
					setState(174);
					forStatement();
					}
					break;
				case 18:
					{
					setState(175);
					gateCallStatement();
					}
					break;
				case 19:
					{
					setState(176);
					gateStatement();
					}
					break;
				case 20:
					{
					setState(177);
					ifStatement();
					}
					break;
				case 21:
					{
					setState(178);
					includeStatement();
					}
					break;
				case 22:
					{
					setState(179);
					ioDeclarationStatement();
					}
					break;
				case 23:
					{
					setState(180);
					measureArrowAssignmentStatement();
					}
					break;
				case 24:
					{
					setState(181);
					nopStatement();
					}
					break;
				case 25:
					{
					setState(182);
					oldStyleDeclarationStatement();
					}
					break;
				case 26:
					{
					setState(183);
					quantumDeclarationStatement();
					}
					break;
				case 27:
					{
					setState(184);
					resetStatement();
					}
					break;
				case 28:
					{
					setState(185);
					returnStatement();
					}
					break;
				case 29:
					{
					setState(186);
					switchStatement();
					}
					break;
				case 30:
					{
					setState(187);
					whileStatement();
					}
					break;
				}
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class AnnotationContext extends ParserRuleContext {
		public TerminalNode AnnotationKeyword() { return getToken(OpenQASM3Parser.AnnotationKeyword, 0); }
		public TerminalNode RemainingLineContent() { return getToken(OpenQASM3Parser.RemainingLineContent, 0); }
		public AnnotationContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_annotation; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterAnnotation(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitAnnotation(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitAnnotation(this);
			else return visitor.visitChildren(this);
		}
	}

	public final AnnotationContext annotation() throws RecognitionException {
		AnnotationContext _localctx = new AnnotationContext(_ctx, getState());
		enterRule(_localctx, 6, RULE_annotation);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(192);
			match(AnnotationKeyword);
			setState(194);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==RemainingLineContent) {
				{
				setState(193);
				match(RemainingLineContent);
				}
			}

			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ScopeContext extends ParserRuleContext {
		public TerminalNode LBRACE() { return getToken(OpenQASM3Parser.LBRACE, 0); }
		public TerminalNode RBRACE() { return getToken(OpenQASM3Parser.RBRACE, 0); }
		public List<StatementOrScopeContext> statementOrScope() {
			return getRuleContexts(StatementOrScopeContext.class);
		}
		public StatementOrScopeContext statementOrScope(int i) {
			return getRuleContext(StatementOrScopeContext.class,i);
		}
		public ScopeContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_scope; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterScope(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitScope(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitScope(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ScopeContext scope() throws RecognitionException {
		ScopeContext _localctx = new ScopeContext(_ctx, getState());
		enterRule(_localctx, 8, RULE_scope);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(196);
			match(LBRACE);
			setState(200);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while ((((_la) & ~0x3f) == 0 && ((1L << _la) & 3025288650022174716L) != 0) || ((((_la - 71)) & ~0x3f) == 0 && ((1L << (_la - 71)) & 268179457L) != 0)) {
				{
				{
				setState(197);
				statementOrScope();
				}
				}
				setState(202);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(203);
			match(RBRACE);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class PragmaContext extends ParserRuleContext {
		public TerminalNode PRAGMA() { return getToken(OpenQASM3Parser.PRAGMA, 0); }
		public TerminalNode RemainingLineContent() { return getToken(OpenQASM3Parser.RemainingLineContent, 0); }
		public PragmaContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_pragma; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterPragma(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitPragma(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitPragma(this);
			else return visitor.visitChildren(this);
		}
	}

	public final PragmaContext pragma() throws RecognitionException {
		PragmaContext _localctx = new PragmaContext(_ctx, getState());
		enterRule(_localctx, 10, RULE_pragma);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(205);
			match(PRAGMA);
			setState(206);
			match(RemainingLineContent);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class StatementOrScopeContext extends ParserRuleContext {
		public StatementContext statement() {
			return getRuleContext(StatementContext.class,0);
		}
		public ScopeContext scope() {
			return getRuleContext(ScopeContext.class,0);
		}
		public StatementOrScopeContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_statementOrScope; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterStatementOrScope(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitStatementOrScope(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitStatementOrScope(this);
			else return visitor.visitChildren(this);
		}
	}

	public final StatementOrScopeContext statementOrScope() throws RecognitionException {
		StatementOrScopeContext _localctx = new StatementOrScopeContext(_ctx, getState());
		enterRule(_localctx, 12, RULE_statementOrScope);
		try {
			setState(210);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case INCLUDE:
			case DEFCALGRAMMAR:
			case DEF:
			case CAL:
			case DEFCAL:
			case GATE:
			case EXTERN:
			case BOX:
			case LET:
			case BREAK:
			case CONTINUE:
			case IF:
			case END:
			case RETURN:
			case FOR:
			case WHILE:
			case SWITCH:
			case NOP:
			case PRAGMA:
			case AnnotationKeyword:
			case INPUT:
			case OUTPUT:
			case CONST:
			case QREG:
			case QUBIT:
			case CREG:
			case BOOL:
			case BIT:
			case INT:
			case UINT:
			case FLOAT:
			case ANGLE:
			case COMPLEX:
			case ARRAY:
			case DURATION:
			case STRETCH:
			case GPHASE:
			case INV:
			case POW:
			case CTRL:
			case NEGCTRL:
			case DURATIONOF:
			case DELAY:
			case RESET:
			case MEASURE:
			case BARRIER:
			case BooleanLiteral:
			case LPAREN:
			case MINUS:
			case TILDE:
			case EXCLAMATION_POINT:
			case ImaginaryLiteral:
			case BinaryIntegerLiteral:
			case OctalIntegerLiteral:
			case DecimalIntegerLiteral:
			case HexIntegerLiteral:
			case Identifier:
			case HardwareQubit:
			case FloatLiteral:
			case TimingLiteral:
			case BitstringLiteral:
				enterOuterAlt(_localctx, 1);
				{
				setState(208);
				statement();
				}
				break;
			case LBRACE:
				enterOuterAlt(_localctx, 2);
				{
				setState(209);
				scope();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class CalibrationGrammarStatementContext extends ParserRuleContext {
		public TerminalNode DEFCALGRAMMAR() { return getToken(OpenQASM3Parser.DEFCALGRAMMAR, 0); }
		public TerminalNode StringLiteral() { return getToken(OpenQASM3Parser.StringLiteral, 0); }
		public TerminalNode SEMICOLON() { return getToken(OpenQASM3Parser.SEMICOLON, 0); }
		public CalibrationGrammarStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_calibrationGrammarStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterCalibrationGrammarStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitCalibrationGrammarStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitCalibrationGrammarStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final CalibrationGrammarStatementContext calibrationGrammarStatement() throws RecognitionException {
		CalibrationGrammarStatementContext _localctx = new CalibrationGrammarStatementContext(_ctx, getState());
		enterRule(_localctx, 14, RULE_calibrationGrammarStatement);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(212);
			match(DEFCALGRAMMAR);
			setState(213);
			match(StringLiteral);
			setState(214);
			match(SEMICOLON);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class IncludeStatementContext extends ParserRuleContext {
		public TerminalNode INCLUDE() { return getToken(OpenQASM3Parser.INCLUDE, 0); }
		public TerminalNode StringLiteral() { return getToken(OpenQASM3Parser.StringLiteral, 0); }
		public TerminalNode SEMICOLON() { return getToken(OpenQASM3Parser.SEMICOLON, 0); }
		public IncludeStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_includeStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterIncludeStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitIncludeStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitIncludeStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final IncludeStatementContext includeStatement() throws RecognitionException {
		IncludeStatementContext _localctx = new IncludeStatementContext(_ctx, getState());
		enterRule(_localctx, 16, RULE_includeStatement);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(216);
			match(INCLUDE);
			setState(217);
			match(StringLiteral);
			setState(218);
			match(SEMICOLON);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class BreakStatementContext extends ParserRuleContext {
		public TerminalNode BREAK() { return getToken(OpenQASM3Parser.BREAK, 0); }
		public TerminalNode SEMICOLON() { return getToken(OpenQASM3Parser.SEMICOLON, 0); }
		public BreakStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_breakStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterBreakStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitBreakStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitBreakStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final BreakStatementContext breakStatement() throws RecognitionException {
		BreakStatementContext _localctx = new BreakStatementContext(_ctx, getState());
		enterRule(_localctx, 18, RULE_breakStatement);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(220);
			match(BREAK);
			setState(221);
			match(SEMICOLON);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ContinueStatementContext extends ParserRuleContext {
		public TerminalNode CONTINUE() { return getToken(OpenQASM3Parser.CONTINUE, 0); }
		public TerminalNode SEMICOLON() { return getToken(OpenQASM3Parser.SEMICOLON, 0); }
		public ContinueStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_continueStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterContinueStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitContinueStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitContinueStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ContinueStatementContext continueStatement() throws RecognitionException {
		ContinueStatementContext _localctx = new ContinueStatementContext(_ctx, getState());
		enterRule(_localctx, 20, RULE_continueStatement);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(223);
			match(CONTINUE);
			setState(224);
			match(SEMICOLON);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class EndStatementContext extends ParserRuleContext {
		public TerminalNode END() { return getToken(OpenQASM3Parser.END, 0); }
		public TerminalNode SEMICOLON() { return getToken(OpenQASM3Parser.SEMICOLON, 0); }
		public EndStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_endStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterEndStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitEndStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitEndStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final EndStatementContext endStatement() throws RecognitionException {
		EndStatementContext _localctx = new EndStatementContext(_ctx, getState());
		enterRule(_localctx, 22, RULE_endStatement);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(226);
			match(END);
			setState(227);
			match(SEMICOLON);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ForStatementContext extends ParserRuleContext {
		public StatementOrScopeContext body;
		public TerminalNode FOR() { return getToken(OpenQASM3Parser.FOR, 0); }
		public ScalarTypeContext scalarType() {
			return getRuleContext(ScalarTypeContext.class,0);
		}
		public TerminalNode Identifier() { return getToken(OpenQASM3Parser.Identifier, 0); }
		public TerminalNode IN() { return getToken(OpenQASM3Parser.IN, 0); }
		public StatementOrScopeContext statementOrScope() {
			return getRuleContext(StatementOrScopeContext.class,0);
		}
		public SetExpressionContext setExpression() {
			return getRuleContext(SetExpressionContext.class,0);
		}
		public TerminalNode LBRACKET() { return getToken(OpenQASM3Parser.LBRACKET, 0); }
		public RangeExpressionContext rangeExpression() {
			return getRuleContext(RangeExpressionContext.class,0);
		}
		public TerminalNode RBRACKET() { return getToken(OpenQASM3Parser.RBRACKET, 0); }
		public ExpressionContext expression() {
			return getRuleContext(ExpressionContext.class,0);
		}
		public ForStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_forStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterForStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitForStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitForStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ForStatementContext forStatement() throws RecognitionException {
		ForStatementContext _localctx = new ForStatementContext(_ctx, getState());
		enterRule(_localctx, 24, RULE_forStatement);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(229);
			match(FOR);
			setState(230);
			scalarType();
			setState(231);
			match(Identifier);
			setState(232);
			match(IN);
			setState(239);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case LBRACE:
				{
				setState(233);
				setExpression();
				}
				break;
			case LBRACKET:
				{
				setState(234);
				match(LBRACKET);
				setState(235);
				rangeExpression();
				setState(236);
				match(RBRACKET);
				}
				break;
			case BOOL:
			case BIT:
			case INT:
			case UINT:
			case FLOAT:
			case ANGLE:
			case COMPLEX:
			case ARRAY:
			case DURATION:
			case STRETCH:
			case DURATIONOF:
			case BooleanLiteral:
			case LPAREN:
			case MINUS:
			case TILDE:
			case EXCLAMATION_POINT:
			case ImaginaryLiteral:
			case BinaryIntegerLiteral:
			case OctalIntegerLiteral:
			case DecimalIntegerLiteral:
			case HexIntegerLiteral:
			case Identifier:
			case HardwareQubit:
			case FloatLiteral:
			case TimingLiteral:
			case BitstringLiteral:
				{
				setState(238);
				expression(0);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
			setState(241);
			((ForStatementContext)_localctx).body = statementOrScope();
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class IfStatementContext extends ParserRuleContext {
		public StatementOrScopeContext if_body;
		public StatementOrScopeContext else_body;
		public TerminalNode IF() { return getToken(OpenQASM3Parser.IF, 0); }
		public TerminalNode LPAREN() { return getToken(OpenQASM3Parser.LPAREN, 0); }
		public ExpressionContext expression() {
			return getRuleContext(ExpressionContext.class,0);
		}
		public TerminalNode RPAREN() { return getToken(OpenQASM3Parser.RPAREN, 0); }
		public List<StatementOrScopeContext> statementOrScope() {
			return getRuleContexts(StatementOrScopeContext.class);
		}
		public StatementOrScopeContext statementOrScope(int i) {
			return getRuleContext(StatementOrScopeContext.class,i);
		}
		public TerminalNode ELSE() { return getToken(OpenQASM3Parser.ELSE, 0); }
		public IfStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_ifStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterIfStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitIfStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitIfStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final IfStatementContext ifStatement() throws RecognitionException {
		IfStatementContext _localctx = new IfStatementContext(_ctx, getState());
		enterRule(_localctx, 26, RULE_ifStatement);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(243);
			match(IF);
			setState(244);
			match(LPAREN);
			setState(245);
			expression(0);
			setState(246);
			match(RPAREN);
			setState(247);
			((IfStatementContext)_localctx).if_body = statementOrScope();
			setState(250);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,9,_ctx) ) {
			case 1:
				{
				setState(248);
				match(ELSE);
				setState(249);
				((IfStatementContext)_localctx).else_body = statementOrScope();
				}
				break;
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ReturnStatementContext extends ParserRuleContext {
		public TerminalNode RETURN() { return getToken(OpenQASM3Parser.RETURN, 0); }
		public TerminalNode SEMICOLON() { return getToken(OpenQASM3Parser.SEMICOLON, 0); }
		public ExpressionContext expression() {
			return getRuleContext(ExpressionContext.class,0);
		}
		public MeasureExpressionContext measureExpression() {
			return getRuleContext(MeasureExpressionContext.class,0);
		}
		public QuantumCallExpressionContext quantumCallExpression() {
			return getRuleContext(QuantumCallExpressionContext.class,0);
		}
		public ReturnStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_returnStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterReturnStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitReturnStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitReturnStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ReturnStatementContext returnStatement() throws RecognitionException {
		ReturnStatementContext _localctx = new ReturnStatementContext(_ctx, getState());
		enterRule(_localctx, 28, RULE_returnStatement);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(252);
			match(RETURN);
			setState(256);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,10,_ctx) ) {
			case 1:
				{
				setState(253);
				expression(0);
				}
				break;
			case 2:
				{
				setState(254);
				measureExpression();
				}
				break;
			case 3:
				{
				setState(255);
				quantumCallExpression();
				}
				break;
			}
			setState(258);
			match(SEMICOLON);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class WhileStatementContext extends ParserRuleContext {
		public StatementOrScopeContext body;
		public TerminalNode WHILE() { return getToken(OpenQASM3Parser.WHILE, 0); }
		public TerminalNode LPAREN() { return getToken(OpenQASM3Parser.LPAREN, 0); }
		public ExpressionContext expression() {
			return getRuleContext(ExpressionContext.class,0);
		}
		public TerminalNode RPAREN() { return getToken(OpenQASM3Parser.RPAREN, 0); }
		public StatementOrScopeContext statementOrScope() {
			return getRuleContext(StatementOrScopeContext.class,0);
		}
		public WhileStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_whileStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterWhileStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitWhileStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitWhileStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final WhileStatementContext whileStatement() throws RecognitionException {
		WhileStatementContext _localctx = new WhileStatementContext(_ctx, getState());
		enterRule(_localctx, 30, RULE_whileStatement);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(260);
			match(WHILE);
			setState(261);
			match(LPAREN);
			setState(262);
			expression(0);
			setState(263);
			match(RPAREN);
			setState(264);
			((WhileStatementContext)_localctx).body = statementOrScope();
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class SwitchStatementContext extends ParserRuleContext {
		public TerminalNode SWITCH() { return getToken(OpenQASM3Parser.SWITCH, 0); }
		public TerminalNode LPAREN() { return getToken(OpenQASM3Parser.LPAREN, 0); }
		public ExpressionContext expression() {
			return getRuleContext(ExpressionContext.class,0);
		}
		public TerminalNode RPAREN() { return getToken(OpenQASM3Parser.RPAREN, 0); }
		public TerminalNode LBRACE() { return getToken(OpenQASM3Parser.LBRACE, 0); }
		public TerminalNode RBRACE() { return getToken(OpenQASM3Parser.RBRACE, 0); }
		public List<SwitchCaseItemContext> switchCaseItem() {
			return getRuleContexts(SwitchCaseItemContext.class);
		}
		public SwitchCaseItemContext switchCaseItem(int i) {
			return getRuleContext(SwitchCaseItemContext.class,i);
		}
		public SwitchStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_switchStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterSwitchStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitSwitchStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitSwitchStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final SwitchStatementContext switchStatement() throws RecognitionException {
		SwitchStatementContext _localctx = new SwitchStatementContext(_ctx, getState());
		enterRule(_localctx, 32, RULE_switchStatement);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(266);
			match(SWITCH);
			setState(267);
			match(LPAREN);
			setState(268);
			expression(0);
			setState(269);
			match(RPAREN);
			setState(270);
			match(LBRACE);
			setState(274);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==CASE || _la==DEFAULT) {
				{
				{
				setState(271);
				switchCaseItem();
				}
				}
				setState(276);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(277);
			match(RBRACE);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class SwitchCaseItemContext extends ParserRuleContext {
		public TerminalNode CASE() { return getToken(OpenQASM3Parser.CASE, 0); }
		public ExpressionListContext expressionList() {
			return getRuleContext(ExpressionListContext.class,0);
		}
		public ScopeContext scope() {
			return getRuleContext(ScopeContext.class,0);
		}
		public TerminalNode DEFAULT() { return getToken(OpenQASM3Parser.DEFAULT, 0); }
		public SwitchCaseItemContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_switchCaseItem; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterSwitchCaseItem(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitSwitchCaseItem(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitSwitchCaseItem(this);
			else return visitor.visitChildren(this);
		}
	}

	public final SwitchCaseItemContext switchCaseItem() throws RecognitionException {
		SwitchCaseItemContext _localctx = new SwitchCaseItemContext(_ctx, getState());
		enterRule(_localctx, 34, RULE_switchCaseItem);
		try {
			setState(285);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case CASE:
				enterOuterAlt(_localctx, 1);
				{
				setState(279);
				match(CASE);
				setState(280);
				expressionList();
				setState(281);
				scope();
				}
				break;
			case DEFAULT:
				enterOuterAlt(_localctx, 2);
				{
				setState(283);
				match(DEFAULT);
				setState(284);
				scope();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class BarrierStatementContext extends ParserRuleContext {
		public TerminalNode BARRIER() { return getToken(OpenQASM3Parser.BARRIER, 0); }
		public TerminalNode SEMICOLON() { return getToken(OpenQASM3Parser.SEMICOLON, 0); }
		public GateOperandListContext gateOperandList() {
			return getRuleContext(GateOperandListContext.class,0);
		}
		public BarrierStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_barrierStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterBarrierStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitBarrierStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitBarrierStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final BarrierStatementContext barrierStatement() throws RecognitionException {
		BarrierStatementContext _localctx = new BarrierStatementContext(_ctx, getState());
		enterRule(_localctx, 36, RULE_barrierStatement);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(287);
			match(BARRIER);
			setState(289);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==Identifier || _la==HardwareQubit) {
				{
				setState(288);
				gateOperandList();
				}
			}

			setState(291);
			match(SEMICOLON);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class BoxStatementContext extends ParserRuleContext {
		public TerminalNode BOX() { return getToken(OpenQASM3Parser.BOX, 0); }
		public ScopeContext scope() {
			return getRuleContext(ScopeContext.class,0);
		}
		public DesignatorContext designator() {
			return getRuleContext(DesignatorContext.class,0);
		}
		public BoxStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_boxStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterBoxStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitBoxStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitBoxStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final BoxStatementContext boxStatement() throws RecognitionException {
		BoxStatementContext _localctx = new BoxStatementContext(_ctx, getState());
		enterRule(_localctx, 38, RULE_boxStatement);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(293);
			match(BOX);
			setState(295);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==LBRACKET) {
				{
				setState(294);
				designator();
				}
			}

			setState(297);
			scope();
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class DelayStatementContext extends ParserRuleContext {
		public TerminalNode DELAY() { return getToken(OpenQASM3Parser.DELAY, 0); }
		public DesignatorContext designator() {
			return getRuleContext(DesignatorContext.class,0);
		}
		public TerminalNode SEMICOLON() { return getToken(OpenQASM3Parser.SEMICOLON, 0); }
		public GateOperandListContext gateOperandList() {
			return getRuleContext(GateOperandListContext.class,0);
		}
		public DelayStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_delayStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterDelayStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitDelayStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitDelayStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final DelayStatementContext delayStatement() throws RecognitionException {
		DelayStatementContext _localctx = new DelayStatementContext(_ctx, getState());
		enterRule(_localctx, 40, RULE_delayStatement);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(299);
			match(DELAY);
			setState(300);
			designator();
			setState(302);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==Identifier || _la==HardwareQubit) {
				{
				setState(301);
				gateOperandList();
				}
			}

			setState(304);
			match(SEMICOLON);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class NopStatementContext extends ParserRuleContext {
		public TerminalNode NOP() { return getToken(OpenQASM3Parser.NOP, 0); }
		public TerminalNode SEMICOLON() { return getToken(OpenQASM3Parser.SEMICOLON, 0); }
		public GateOperandListContext gateOperandList() {
			return getRuleContext(GateOperandListContext.class,0);
		}
		public NopStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_nopStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterNopStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitNopStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitNopStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final NopStatementContext nopStatement() throws RecognitionException {
		NopStatementContext _localctx = new NopStatementContext(_ctx, getState());
		enterRule(_localctx, 42, RULE_nopStatement);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(306);
			match(NOP);
			setState(308);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==Identifier || _la==HardwareQubit) {
				{
				setState(307);
				gateOperandList();
				}
			}

			setState(310);
			match(SEMICOLON);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class GateCallStatementContext extends ParserRuleContext {
		public TerminalNode Identifier() { return getToken(OpenQASM3Parser.Identifier, 0); }
		public GateOperandListContext gateOperandList() {
			return getRuleContext(GateOperandListContext.class,0);
		}
		public TerminalNode SEMICOLON() { return getToken(OpenQASM3Parser.SEMICOLON, 0); }
		public List<GateModifierContext> gateModifier() {
			return getRuleContexts(GateModifierContext.class);
		}
		public GateModifierContext gateModifier(int i) {
			return getRuleContext(GateModifierContext.class,i);
		}
		public TerminalNode LPAREN() { return getToken(OpenQASM3Parser.LPAREN, 0); }
		public TerminalNode RPAREN() { return getToken(OpenQASM3Parser.RPAREN, 0); }
		public DesignatorContext designator() {
			return getRuleContext(DesignatorContext.class,0);
		}
		public ExpressionListContext expressionList() {
			return getRuleContext(ExpressionListContext.class,0);
		}
		public TerminalNode GPHASE() { return getToken(OpenQASM3Parser.GPHASE, 0); }
		public GateCallStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_gateCallStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterGateCallStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitGateCallStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitGateCallStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final GateCallStatementContext gateCallStatement() throws RecognitionException {
		GateCallStatementContext _localctx = new GateCallStatementContext(_ctx, getState());
		enterRule(_localctx, 44, RULE_gateCallStatement);
		int _la;
		try {
			setState(353);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,26,_ctx) ) {
			case 1:
				enterOuterAlt(_localctx, 1);
				{
				setState(315);
				_errHandler.sync(this);
				_la = _input.LA(1);
				while ((((_la) & ~0x3f) == 0 && ((1L << _la) & 1055531162664960L) != 0)) {
					{
					{
					setState(312);
					gateModifier();
					}
					}
					setState(317);
					_errHandler.sync(this);
					_la = _input.LA(1);
				}
				setState(318);
				match(Identifier);
				setState(324);
				_errHandler.sync(this);
				_la = _input.LA(1);
				if (_la==LPAREN) {
					{
					setState(319);
					match(LPAREN);
					setState(321);
					_errHandler.sync(this);
					_la = _input.LA(1);
					if ((((_la) & ~0x3f) == 0 && ((1L << _la) & 2380183172211015680L) != 0) || ((((_la - 71)) & ~0x3f) == 0 && ((1L << (_la - 71)) & 268179457L) != 0)) {
						{
						setState(320);
						expressionList();
						}
					}

					setState(323);
					match(RPAREN);
					}
				}

				setState(327);
				_errHandler.sync(this);
				_la = _input.LA(1);
				if (_la==LBRACKET) {
					{
					setState(326);
					designator();
					}
				}

				setState(329);
				gateOperandList();
				setState(330);
				match(SEMICOLON);
				}
				break;
			case 2:
				enterOuterAlt(_localctx, 2);
				{
				setState(335);
				_errHandler.sync(this);
				_la = _input.LA(1);
				while ((((_la) & ~0x3f) == 0 && ((1L << _la) & 1055531162664960L) != 0)) {
					{
					{
					setState(332);
					gateModifier();
					}
					}
					setState(337);
					_errHandler.sync(this);
					_la = _input.LA(1);
				}
				setState(338);
				match(GPHASE);
				setState(344);
				_errHandler.sync(this);
				_la = _input.LA(1);
				if (_la==LPAREN) {
					{
					setState(339);
					match(LPAREN);
					setState(341);
					_errHandler.sync(this);
					_la = _input.LA(1);
					if ((((_la) & ~0x3f) == 0 && ((1L << _la) & 2380183172211015680L) != 0) || ((((_la - 71)) & ~0x3f) == 0 && ((1L << (_la - 71)) & 268179457L) != 0)) {
						{
						setState(340);
						expressionList();
						}
					}

					setState(343);
					match(RPAREN);
					}
				}

				setState(347);
				_errHandler.sync(this);
				_la = _input.LA(1);
				if (_la==LBRACKET) {
					{
					setState(346);
					designator();
					}
				}

				setState(350);
				_errHandler.sync(this);
				_la = _input.LA(1);
				if (_la==Identifier || _la==HardwareQubit) {
					{
					setState(349);
					gateOperandList();
					}
				}

				setState(352);
				match(SEMICOLON);
				}
				break;
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class MeasureArrowAssignmentStatementContext extends ParserRuleContext {
		public TerminalNode SEMICOLON() { return getToken(OpenQASM3Parser.SEMICOLON, 0); }
		public MeasureExpressionContext measureExpression() {
			return getRuleContext(MeasureExpressionContext.class,0);
		}
		public QuantumCallExpressionContext quantumCallExpression() {
			return getRuleContext(QuantumCallExpressionContext.class,0);
		}
		public TerminalNode ARROW() { return getToken(OpenQASM3Parser.ARROW, 0); }
		public IndexedIdentifierContext indexedIdentifier() {
			return getRuleContext(IndexedIdentifierContext.class,0);
		}
		public MeasureArrowAssignmentStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_measureArrowAssignmentStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterMeasureArrowAssignmentStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitMeasureArrowAssignmentStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitMeasureArrowAssignmentStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final MeasureArrowAssignmentStatementContext measureArrowAssignmentStatement() throws RecognitionException {
		MeasureArrowAssignmentStatementContext _localctx = new MeasureArrowAssignmentStatementContext(_ctx, getState());
		enterRule(_localctx, 46, RULE_measureArrowAssignmentStatement);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(357);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case MEASURE:
				{
				setState(355);
				measureExpression();
				}
				break;
			case Identifier:
				{
				setState(356);
				quantumCallExpression();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
			setState(361);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==ARROW) {
				{
				setState(359);
				match(ARROW);
				setState(360);
				indexedIdentifier();
				}
			}

			setState(363);
			match(SEMICOLON);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ResetStatementContext extends ParserRuleContext {
		public TerminalNode RESET() { return getToken(OpenQASM3Parser.RESET, 0); }
		public GateOperandContext gateOperand() {
			return getRuleContext(GateOperandContext.class,0);
		}
		public TerminalNode SEMICOLON() { return getToken(OpenQASM3Parser.SEMICOLON, 0); }
		public ResetStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_resetStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterResetStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitResetStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitResetStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ResetStatementContext resetStatement() throws RecognitionException {
		ResetStatementContext _localctx = new ResetStatementContext(_ctx, getState());
		enterRule(_localctx, 48, RULE_resetStatement);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(365);
			match(RESET);
			setState(366);
			gateOperand();
			setState(367);
			match(SEMICOLON);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class AliasDeclarationStatementContext extends ParserRuleContext {
		public TerminalNode LET() { return getToken(OpenQASM3Parser.LET, 0); }
		public TerminalNode Identifier() { return getToken(OpenQASM3Parser.Identifier, 0); }
		public TerminalNode EQUALS() { return getToken(OpenQASM3Parser.EQUALS, 0); }
		public AliasExpressionContext aliasExpression() {
			return getRuleContext(AliasExpressionContext.class,0);
		}
		public TerminalNode SEMICOLON() { return getToken(OpenQASM3Parser.SEMICOLON, 0); }
		public AliasDeclarationStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_aliasDeclarationStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterAliasDeclarationStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitAliasDeclarationStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitAliasDeclarationStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final AliasDeclarationStatementContext aliasDeclarationStatement() throws RecognitionException {
		AliasDeclarationStatementContext _localctx = new AliasDeclarationStatementContext(_ctx, getState());
		enterRule(_localctx, 50, RULE_aliasDeclarationStatement);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(369);
			match(LET);
			setState(370);
			match(Identifier);
			setState(371);
			match(EQUALS);
			setState(372);
			aliasExpression();
			setState(373);
			match(SEMICOLON);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ClassicalDeclarationStatementContext extends ParserRuleContext {
		public TerminalNode Identifier() { return getToken(OpenQASM3Parser.Identifier, 0); }
		public TerminalNode SEMICOLON() { return getToken(OpenQASM3Parser.SEMICOLON, 0); }
		public ScalarTypeContext scalarType() {
			return getRuleContext(ScalarTypeContext.class,0);
		}
		public ArrayTypeContext arrayType() {
			return getRuleContext(ArrayTypeContext.class,0);
		}
		public TerminalNode EQUALS() { return getToken(OpenQASM3Parser.EQUALS, 0); }
		public DeclarationExpressionContext declarationExpression() {
			return getRuleContext(DeclarationExpressionContext.class,0);
		}
		public ClassicalDeclarationStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_classicalDeclarationStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterClassicalDeclarationStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitClassicalDeclarationStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitClassicalDeclarationStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ClassicalDeclarationStatementContext classicalDeclarationStatement() throws RecognitionException {
		ClassicalDeclarationStatementContext _localctx = new ClassicalDeclarationStatementContext(_ctx, getState());
		enterRule(_localctx, 52, RULE_classicalDeclarationStatement);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(377);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case BOOL:
			case BIT:
			case INT:
			case UINT:
			case FLOAT:
			case ANGLE:
			case COMPLEX:
			case DURATION:
			case STRETCH:
				{
				setState(375);
				scalarType();
				}
				break;
			case ARRAY:
				{
				setState(376);
				arrayType();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
			setState(379);
			match(Identifier);
			setState(382);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==EQUALS) {
				{
				setState(380);
				match(EQUALS);
				setState(381);
				declarationExpression();
				}
			}

			setState(384);
			match(SEMICOLON);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ConstDeclarationStatementContext extends ParserRuleContext {
		public TerminalNode CONST() { return getToken(OpenQASM3Parser.CONST, 0); }
		public ScalarTypeContext scalarType() {
			return getRuleContext(ScalarTypeContext.class,0);
		}
		public TerminalNode Identifier() { return getToken(OpenQASM3Parser.Identifier, 0); }
		public TerminalNode EQUALS() { return getToken(OpenQASM3Parser.EQUALS, 0); }
		public DeclarationExpressionContext declarationExpression() {
			return getRuleContext(DeclarationExpressionContext.class,0);
		}
		public TerminalNode SEMICOLON() { return getToken(OpenQASM3Parser.SEMICOLON, 0); }
		public ConstDeclarationStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_constDeclarationStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterConstDeclarationStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitConstDeclarationStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitConstDeclarationStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ConstDeclarationStatementContext constDeclarationStatement() throws RecognitionException {
		ConstDeclarationStatementContext _localctx = new ConstDeclarationStatementContext(_ctx, getState());
		enterRule(_localctx, 54, RULE_constDeclarationStatement);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(386);
			match(CONST);
			setState(387);
			scalarType();
			setState(388);
			match(Identifier);
			setState(389);
			match(EQUALS);
			setState(390);
			declarationExpression();
			setState(391);
			match(SEMICOLON);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class IoDeclarationStatementContext extends ParserRuleContext {
		public TerminalNode Identifier() { return getToken(OpenQASM3Parser.Identifier, 0); }
		public TerminalNode SEMICOLON() { return getToken(OpenQASM3Parser.SEMICOLON, 0); }
		public TerminalNode INPUT() { return getToken(OpenQASM3Parser.INPUT, 0); }
		public TerminalNode OUTPUT() { return getToken(OpenQASM3Parser.OUTPUT, 0); }
		public ScalarTypeContext scalarType() {
			return getRuleContext(ScalarTypeContext.class,0);
		}
		public ArrayTypeContext arrayType() {
			return getRuleContext(ArrayTypeContext.class,0);
		}
		public IoDeclarationStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_ioDeclarationStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterIoDeclarationStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitIoDeclarationStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitIoDeclarationStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final IoDeclarationStatementContext ioDeclarationStatement() throws RecognitionException {
		IoDeclarationStatementContext _localctx = new IoDeclarationStatementContext(_ctx, getState());
		enterRule(_localctx, 56, RULE_ioDeclarationStatement);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(393);
			_la = _input.LA(1);
			if ( !(_la==INPUT || _la==OUTPUT) ) {
			_errHandler.recoverInline(this);
			}
			else {
				if ( _input.LA(1)==Token.EOF ) matchedEOF = true;
				_errHandler.reportMatch(this);
				consume();
			}
			setState(396);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case BOOL:
			case BIT:
			case INT:
			case UINT:
			case FLOAT:
			case ANGLE:
			case COMPLEX:
			case DURATION:
			case STRETCH:
				{
				setState(394);
				scalarType();
				}
				break;
			case ARRAY:
				{
				setState(395);
				arrayType();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
			setState(398);
			match(Identifier);
			setState(399);
			match(SEMICOLON);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class OldStyleDeclarationStatementContext extends ParserRuleContext {
		public TerminalNode Identifier() { return getToken(OpenQASM3Parser.Identifier, 0); }
		public TerminalNode SEMICOLON() { return getToken(OpenQASM3Parser.SEMICOLON, 0); }
		public TerminalNode CREG() { return getToken(OpenQASM3Parser.CREG, 0); }
		public TerminalNode QREG() { return getToken(OpenQASM3Parser.QREG, 0); }
		public DesignatorContext designator() {
			return getRuleContext(DesignatorContext.class,0);
		}
		public OldStyleDeclarationStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_oldStyleDeclarationStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterOldStyleDeclarationStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitOldStyleDeclarationStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitOldStyleDeclarationStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final OldStyleDeclarationStatementContext oldStyleDeclarationStatement() throws RecognitionException {
		OldStyleDeclarationStatementContext _localctx = new OldStyleDeclarationStatementContext(_ctx, getState());
		enterRule(_localctx, 58, RULE_oldStyleDeclarationStatement);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(401);
			_la = _input.LA(1);
			if ( !(_la==QREG || _la==CREG) ) {
			_errHandler.recoverInline(this);
			}
			else {
				if ( _input.LA(1)==Token.EOF ) matchedEOF = true;
				_errHandler.reportMatch(this);
				consume();
			}
			setState(402);
			match(Identifier);
			setState(404);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==LBRACKET) {
				{
				setState(403);
				designator();
				}
			}

			setState(406);
			match(SEMICOLON);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class QuantumDeclarationStatementContext extends ParserRuleContext {
		public QubitTypeContext qubitType() {
			return getRuleContext(QubitTypeContext.class,0);
		}
		public TerminalNode Identifier() { return getToken(OpenQASM3Parser.Identifier, 0); }
		public TerminalNode SEMICOLON() { return getToken(OpenQASM3Parser.SEMICOLON, 0); }
		public QuantumDeclarationStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_quantumDeclarationStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterQuantumDeclarationStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitQuantumDeclarationStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitQuantumDeclarationStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final QuantumDeclarationStatementContext quantumDeclarationStatement() throws RecognitionException {
		QuantumDeclarationStatementContext _localctx = new QuantumDeclarationStatementContext(_ctx, getState());
		enterRule(_localctx, 60, RULE_quantumDeclarationStatement);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(408);
			qubitType();
			setState(409);
			match(Identifier);
			setState(410);
			match(SEMICOLON);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class DefStatementContext extends ParserRuleContext {
		public TerminalNode DEF() { return getToken(OpenQASM3Parser.DEF, 0); }
		public TerminalNode Identifier() { return getToken(OpenQASM3Parser.Identifier, 0); }
		public TerminalNode LPAREN() { return getToken(OpenQASM3Parser.LPAREN, 0); }
		public TerminalNode RPAREN() { return getToken(OpenQASM3Parser.RPAREN, 0); }
		public ScopeContext scope() {
			return getRuleContext(ScopeContext.class,0);
		}
		public ArgumentDefinitionListContext argumentDefinitionList() {
			return getRuleContext(ArgumentDefinitionListContext.class,0);
		}
		public ReturnSignatureContext returnSignature() {
			return getRuleContext(ReturnSignatureContext.class,0);
		}
		public DefStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_defStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterDefStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitDefStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitDefStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final DefStatementContext defStatement() throws RecognitionException {
		DefStatementContext _localctx = new DefStatementContext(_ctx, getState());
		enterRule(_localctx, 62, RULE_defStatement);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(412);
			match(DEF);
			setState(413);
			match(Identifier);
			setState(414);
			match(LPAREN);
			setState(416);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if ((((_la) & ~0x3f) == 0 && ((1L << _la) & 28586765451264L) != 0)) {
				{
				setState(415);
				argumentDefinitionList();
				}
			}

			setState(418);
			match(RPAREN);
			setState(420);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==ARROW) {
				{
				setState(419);
				returnSignature();
				}
			}

			setState(422);
			scope();
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ExternStatementContext extends ParserRuleContext {
		public TerminalNode EXTERN() { return getToken(OpenQASM3Parser.EXTERN, 0); }
		public TerminalNode Identifier() { return getToken(OpenQASM3Parser.Identifier, 0); }
		public TerminalNode LPAREN() { return getToken(OpenQASM3Parser.LPAREN, 0); }
		public TerminalNode RPAREN() { return getToken(OpenQASM3Parser.RPAREN, 0); }
		public TerminalNode SEMICOLON() { return getToken(OpenQASM3Parser.SEMICOLON, 0); }
		public ExternArgumentListContext externArgumentList() {
			return getRuleContext(ExternArgumentListContext.class,0);
		}
		public ReturnSignatureContext returnSignature() {
			return getRuleContext(ReturnSignatureContext.class,0);
		}
		public ExternStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_externStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterExternStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitExternStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitExternStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ExternStatementContext externStatement() throws RecognitionException {
		ExternStatementContext _localctx = new ExternStatementContext(_ctx, getState());
		enterRule(_localctx, 64, RULE_externStatement);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(424);
			match(EXTERN);
			setState(425);
			match(Identifier);
			setState(426);
			match(LPAREN);
			setState(428);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if ((((_la) & ~0x3f) == 0 && ((1L << _la) & 28580323000320L) != 0)) {
				{
				setState(427);
				externArgumentList();
				}
			}

			setState(430);
			match(RPAREN);
			setState(432);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==ARROW) {
				{
				setState(431);
				returnSignature();
				}
			}

			setState(434);
			match(SEMICOLON);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class GateStatementContext extends ParserRuleContext {
		public IdentifierListContext params;
		public IdentifierListContext qubits;
		public TerminalNode GATE() { return getToken(OpenQASM3Parser.GATE, 0); }
		public TerminalNode Identifier() { return getToken(OpenQASM3Parser.Identifier, 0); }
		public ScopeContext scope() {
			return getRuleContext(ScopeContext.class,0);
		}
		public List<IdentifierListContext> identifierList() {
			return getRuleContexts(IdentifierListContext.class);
		}
		public IdentifierListContext identifierList(int i) {
			return getRuleContext(IdentifierListContext.class,i);
		}
		public TerminalNode LPAREN() { return getToken(OpenQASM3Parser.LPAREN, 0); }
		public TerminalNode RPAREN() { return getToken(OpenQASM3Parser.RPAREN, 0); }
		public GateStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_gateStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterGateStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitGateStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitGateStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final GateStatementContext gateStatement() throws RecognitionException {
		GateStatementContext _localctx = new GateStatementContext(_ctx, getState());
		enterRule(_localctx, 66, RULE_gateStatement);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(436);
			match(GATE);
			setState(437);
			match(Identifier);
			setState(443);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==LPAREN) {
				{
				setState(438);
				match(LPAREN);
				setState(440);
				_errHandler.sync(this);
				_la = _input.LA(1);
				if (_la==Identifier) {
					{
					setState(439);
					((GateStatementContext)_localctx).params = identifierList();
					}
				}

				setState(442);
				match(RPAREN);
				}
			}

			setState(445);
			((GateStatementContext)_localctx).qubits = identifierList();
			setState(446);
			scope();
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class AssignmentStatementContext extends ParserRuleContext {
		public Token op;
		public IndexedIdentifierContext indexedIdentifier() {
			return getRuleContext(IndexedIdentifierContext.class,0);
		}
		public TerminalNode SEMICOLON() { return getToken(OpenQASM3Parser.SEMICOLON, 0); }
		public TerminalNode EQUALS() { return getToken(OpenQASM3Parser.EQUALS, 0); }
		public TerminalNode CompoundAssignmentOperator() { return getToken(OpenQASM3Parser.CompoundAssignmentOperator, 0); }
		public ExpressionContext expression() {
			return getRuleContext(ExpressionContext.class,0);
		}
		public MeasureExpressionContext measureExpression() {
			return getRuleContext(MeasureExpressionContext.class,0);
		}
		public QuantumCallExpressionContext quantumCallExpression() {
			return getRuleContext(QuantumCallExpressionContext.class,0);
		}
		public AssignmentStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_assignmentStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterAssignmentStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitAssignmentStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitAssignmentStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final AssignmentStatementContext assignmentStatement() throws RecognitionException {
		AssignmentStatementContext _localctx = new AssignmentStatementContext(_ctx, getState());
		enterRule(_localctx, 68, RULE_assignmentStatement);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(448);
			indexedIdentifier();
			setState(449);
			((AssignmentStatementContext)_localctx).op = _input.LT(1);
			_la = _input.LA(1);
			if ( !(_la==EQUALS || _la==CompoundAssignmentOperator) ) {
				((AssignmentStatementContext)_localctx).op = (Token)_errHandler.recoverInline(this);
			}
			else {
				if ( _input.LA(1)==Token.EOF ) matchedEOF = true;
				_errHandler.reportMatch(this);
				consume();
			}
			setState(453);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,39,_ctx) ) {
			case 1:
				{
				setState(450);
				expression(0);
				}
				break;
			case 2:
				{
				setState(451);
				measureExpression();
				}
				break;
			case 3:
				{
				setState(452);
				quantumCallExpression();
				}
				break;
			}
			setState(455);
			match(SEMICOLON);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ExpressionStatementContext extends ParserRuleContext {
		public ExpressionContext expression() {
			return getRuleContext(ExpressionContext.class,0);
		}
		public TerminalNode SEMICOLON() { return getToken(OpenQASM3Parser.SEMICOLON, 0); }
		public ExpressionStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_expressionStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterExpressionStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitExpressionStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitExpressionStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ExpressionStatementContext expressionStatement() throws RecognitionException {
		ExpressionStatementContext _localctx = new ExpressionStatementContext(_ctx, getState());
		enterRule(_localctx, 70, RULE_expressionStatement);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(457);
			expression(0);
			setState(458);
			match(SEMICOLON);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class CalStatementContext extends ParserRuleContext {
		public TerminalNode CAL() { return getToken(OpenQASM3Parser.CAL, 0); }
		public TerminalNode LBRACE() { return getToken(OpenQASM3Parser.LBRACE, 0); }
		public TerminalNode RBRACE() { return getToken(OpenQASM3Parser.RBRACE, 0); }
		public TerminalNode CalibrationBlock() { return getToken(OpenQASM3Parser.CalibrationBlock, 0); }
		public CalStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_calStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterCalStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitCalStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitCalStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final CalStatementContext calStatement() throws RecognitionException {
		CalStatementContext _localctx = new CalStatementContext(_ctx, getState());
		enterRule(_localctx, 72, RULE_calStatement);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(460);
			match(CAL);
			setState(461);
			match(LBRACE);
			setState(463);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==CalibrationBlock) {
				{
				setState(462);
				match(CalibrationBlock);
				}
			}

			setState(465);
			match(RBRACE);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class DefcalStatementContext extends ParserRuleContext {
		public TerminalNode DEFCAL() { return getToken(OpenQASM3Parser.DEFCAL, 0); }
		public DefcalTargetContext defcalTarget() {
			return getRuleContext(DefcalTargetContext.class,0);
		}
		public DefcalOperandListContext defcalOperandList() {
			return getRuleContext(DefcalOperandListContext.class,0);
		}
		public TerminalNode LBRACE() { return getToken(OpenQASM3Parser.LBRACE, 0); }
		public TerminalNode RBRACE() { return getToken(OpenQASM3Parser.RBRACE, 0); }
		public TerminalNode LPAREN() { return getToken(OpenQASM3Parser.LPAREN, 0); }
		public TerminalNode RPAREN() { return getToken(OpenQASM3Parser.RPAREN, 0); }
		public ReturnSignatureContext returnSignature() {
			return getRuleContext(ReturnSignatureContext.class,0);
		}
		public TerminalNode CalibrationBlock() { return getToken(OpenQASM3Parser.CalibrationBlock, 0); }
		public DefcalArgumentDefinitionListContext defcalArgumentDefinitionList() {
			return getRuleContext(DefcalArgumentDefinitionListContext.class,0);
		}
		public DefcalStatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_defcalStatement; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterDefcalStatement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitDefcalStatement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitDefcalStatement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final DefcalStatementContext defcalStatement() throws RecognitionException {
		DefcalStatementContext _localctx = new DefcalStatementContext(_ctx, getState());
		enterRule(_localctx, 74, RULE_defcalStatement);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(467);
			match(DEFCAL);
			setState(468);
			defcalTarget();
			setState(474);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==LPAREN) {
				{
				setState(469);
				match(LPAREN);
				setState(471);
				_errHandler.sync(this);
				_la = _input.LA(1);
				if ((((_la) & ~0x3f) == 0 && ((1L << _la) & 2380183188854013952L) != 0) || ((((_la - 71)) & ~0x3f) == 0 && ((1L << (_la - 71)) & 268179457L) != 0)) {
					{
					setState(470);
					defcalArgumentDefinitionList();
					}
				}

				setState(473);
				match(RPAREN);
				}
			}

			setState(476);
			defcalOperandList();
			setState(478);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==ARROW) {
				{
				setState(477);
				returnSignature();
				}
			}

			setState(480);
			match(LBRACE);
			setState(482);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==CalibrationBlock) {
				{
				setState(481);
				match(CalibrationBlock);
				}
			}

			setState(484);
			match(RBRACE);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ExpressionContext extends ParserRuleContext {
		public ExpressionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_expression; }
	 
		public ExpressionContext() { }
		public void copyFrom(ExpressionContext ctx) {
			super.copyFrom(ctx);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class BitwiseXorExpressionContext extends ExpressionContext {
		public Token op;
		public List<ExpressionContext> expression() {
			return getRuleContexts(ExpressionContext.class);
		}
		public ExpressionContext expression(int i) {
			return getRuleContext(ExpressionContext.class,i);
		}
		public TerminalNode CARET() { return getToken(OpenQASM3Parser.CARET, 0); }
		public BitwiseXorExpressionContext(ExpressionContext ctx) { copyFrom(ctx); }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterBitwiseXorExpression(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitBitwiseXorExpression(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitBitwiseXorExpression(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class AdditiveExpressionContext extends ExpressionContext {
		public Token op;
		public List<ExpressionContext> expression() {
			return getRuleContexts(ExpressionContext.class);
		}
		public ExpressionContext expression(int i) {
			return getRuleContext(ExpressionContext.class,i);
		}
		public TerminalNode PLUS() { return getToken(OpenQASM3Parser.PLUS, 0); }
		public TerminalNode MINUS() { return getToken(OpenQASM3Parser.MINUS, 0); }
		public AdditiveExpressionContext(ExpressionContext ctx) { copyFrom(ctx); }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterAdditiveExpression(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitAdditiveExpression(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitAdditiveExpression(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class DurationofExpressionContext extends ExpressionContext {
		public TerminalNode DURATIONOF() { return getToken(OpenQASM3Parser.DURATIONOF, 0); }
		public TerminalNode LPAREN() { return getToken(OpenQASM3Parser.LPAREN, 0); }
		public ScopeContext scope() {
			return getRuleContext(ScopeContext.class,0);
		}
		public TerminalNode RPAREN() { return getToken(OpenQASM3Parser.RPAREN, 0); }
		public DurationofExpressionContext(ExpressionContext ctx) { copyFrom(ctx); }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterDurationofExpression(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitDurationofExpression(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitDurationofExpression(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class ParenthesisExpressionContext extends ExpressionContext {
		public TerminalNode LPAREN() { return getToken(OpenQASM3Parser.LPAREN, 0); }
		public ExpressionContext expression() {
			return getRuleContext(ExpressionContext.class,0);
		}
		public TerminalNode RPAREN() { return getToken(OpenQASM3Parser.RPAREN, 0); }
		public ParenthesisExpressionContext(ExpressionContext ctx) { copyFrom(ctx); }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterParenthesisExpression(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitParenthesisExpression(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitParenthesisExpression(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class ComparisonExpressionContext extends ExpressionContext {
		public Token op;
		public List<ExpressionContext> expression() {
			return getRuleContexts(ExpressionContext.class);
		}
		public ExpressionContext expression(int i) {
			return getRuleContext(ExpressionContext.class,i);
		}
		public TerminalNode ComparisonOperator() { return getToken(OpenQASM3Parser.ComparisonOperator, 0); }
		public ComparisonExpressionContext(ExpressionContext ctx) { copyFrom(ctx); }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterComparisonExpression(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitComparisonExpression(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitComparisonExpression(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class MultiplicativeExpressionContext extends ExpressionContext {
		public Token op;
		public List<ExpressionContext> expression() {
			return getRuleContexts(ExpressionContext.class);
		}
		public ExpressionContext expression(int i) {
			return getRuleContext(ExpressionContext.class,i);
		}
		public TerminalNode ASTERISK() { return getToken(OpenQASM3Parser.ASTERISK, 0); }
		public TerminalNode SLASH() { return getToken(OpenQASM3Parser.SLASH, 0); }
		public TerminalNode PERCENT() { return getToken(OpenQASM3Parser.PERCENT, 0); }
		public MultiplicativeExpressionContext(ExpressionContext ctx) { copyFrom(ctx); }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterMultiplicativeExpression(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitMultiplicativeExpression(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitMultiplicativeExpression(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class LogicalOrExpressionContext extends ExpressionContext {
		public Token op;
		public List<ExpressionContext> expression() {
			return getRuleContexts(ExpressionContext.class);
		}
		public ExpressionContext expression(int i) {
			return getRuleContext(ExpressionContext.class,i);
		}
		public TerminalNode DOUBLE_PIPE() { return getToken(OpenQASM3Parser.DOUBLE_PIPE, 0); }
		public LogicalOrExpressionContext(ExpressionContext ctx) { copyFrom(ctx); }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterLogicalOrExpression(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitLogicalOrExpression(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitLogicalOrExpression(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class CastExpressionContext extends ExpressionContext {
		public TerminalNode LPAREN() { return getToken(OpenQASM3Parser.LPAREN, 0); }
		public ExpressionContext expression() {
			return getRuleContext(ExpressionContext.class,0);
		}
		public TerminalNode RPAREN() { return getToken(OpenQASM3Parser.RPAREN, 0); }
		public ScalarTypeContext scalarType() {
			return getRuleContext(ScalarTypeContext.class,0);
		}
		public ArrayTypeContext arrayType() {
			return getRuleContext(ArrayTypeContext.class,0);
		}
		public CastExpressionContext(ExpressionContext ctx) { copyFrom(ctx); }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterCastExpression(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitCastExpression(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitCastExpression(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class PowerExpressionContext extends ExpressionContext {
		public Token op;
		public List<ExpressionContext> expression() {
			return getRuleContexts(ExpressionContext.class);
		}
		public ExpressionContext expression(int i) {
			return getRuleContext(ExpressionContext.class,i);
		}
		public TerminalNode DOUBLE_ASTERISK() { return getToken(OpenQASM3Parser.DOUBLE_ASTERISK, 0); }
		public PowerExpressionContext(ExpressionContext ctx) { copyFrom(ctx); }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterPowerExpression(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitPowerExpression(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitPowerExpression(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class BitwiseOrExpressionContext extends ExpressionContext {
		public Token op;
		public List<ExpressionContext> expression() {
			return getRuleContexts(ExpressionContext.class);
		}
		public ExpressionContext expression(int i) {
			return getRuleContext(ExpressionContext.class,i);
		}
		public TerminalNode PIPE() { return getToken(OpenQASM3Parser.PIPE, 0); }
		public BitwiseOrExpressionContext(ExpressionContext ctx) { copyFrom(ctx); }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterBitwiseOrExpression(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitBitwiseOrExpression(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitBitwiseOrExpression(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class CallExpressionContext extends ExpressionContext {
		public TerminalNode Identifier() { return getToken(OpenQASM3Parser.Identifier, 0); }
		public TerminalNode LPAREN() { return getToken(OpenQASM3Parser.LPAREN, 0); }
		public TerminalNode RPAREN() { return getToken(OpenQASM3Parser.RPAREN, 0); }
		public ExpressionListContext expressionList() {
			return getRuleContext(ExpressionListContext.class,0);
		}
		public CallExpressionContext(ExpressionContext ctx) { copyFrom(ctx); }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterCallExpression(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitCallExpression(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitCallExpression(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class BitshiftExpressionContext extends ExpressionContext {
		public Token op;
		public List<ExpressionContext> expression() {
			return getRuleContexts(ExpressionContext.class);
		}
		public ExpressionContext expression(int i) {
			return getRuleContext(ExpressionContext.class,i);
		}
		public TerminalNode BitshiftOperator() { return getToken(OpenQASM3Parser.BitshiftOperator, 0); }
		public BitshiftExpressionContext(ExpressionContext ctx) { copyFrom(ctx); }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterBitshiftExpression(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitBitshiftExpression(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitBitshiftExpression(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class BitwiseAndExpressionContext extends ExpressionContext {
		public Token op;
		public List<ExpressionContext> expression() {
			return getRuleContexts(ExpressionContext.class);
		}
		public ExpressionContext expression(int i) {
			return getRuleContext(ExpressionContext.class,i);
		}
		public TerminalNode AMPERSAND() { return getToken(OpenQASM3Parser.AMPERSAND, 0); }
		public BitwiseAndExpressionContext(ExpressionContext ctx) { copyFrom(ctx); }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterBitwiseAndExpression(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitBitwiseAndExpression(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitBitwiseAndExpression(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class EqualityExpressionContext extends ExpressionContext {
		public Token op;
		public List<ExpressionContext> expression() {
			return getRuleContexts(ExpressionContext.class);
		}
		public ExpressionContext expression(int i) {
			return getRuleContext(ExpressionContext.class,i);
		}
		public TerminalNode EqualityOperator() { return getToken(OpenQASM3Parser.EqualityOperator, 0); }
		public EqualityExpressionContext(ExpressionContext ctx) { copyFrom(ctx); }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterEqualityExpression(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitEqualityExpression(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitEqualityExpression(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class LogicalAndExpressionContext extends ExpressionContext {
		public Token op;
		public List<ExpressionContext> expression() {
			return getRuleContexts(ExpressionContext.class);
		}
		public ExpressionContext expression(int i) {
			return getRuleContext(ExpressionContext.class,i);
		}
		public TerminalNode DOUBLE_AMPERSAND() { return getToken(OpenQASM3Parser.DOUBLE_AMPERSAND, 0); }
		public LogicalAndExpressionContext(ExpressionContext ctx) { copyFrom(ctx); }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterLogicalAndExpression(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitLogicalAndExpression(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitLogicalAndExpression(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class IndexExpressionContext extends ExpressionContext {
		public ExpressionContext expression() {
			return getRuleContext(ExpressionContext.class,0);
		}
		public IndexOperatorContext indexOperator() {
			return getRuleContext(IndexOperatorContext.class,0);
		}
		public IndexExpressionContext(ExpressionContext ctx) { copyFrom(ctx); }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterIndexExpression(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitIndexExpression(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitIndexExpression(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class UnaryExpressionContext extends ExpressionContext {
		public Token op;
		public ExpressionContext expression() {
			return getRuleContext(ExpressionContext.class,0);
		}
		public TerminalNode TILDE() { return getToken(OpenQASM3Parser.TILDE, 0); }
		public TerminalNode EXCLAMATION_POINT() { return getToken(OpenQASM3Parser.EXCLAMATION_POINT, 0); }
		public TerminalNode MINUS() { return getToken(OpenQASM3Parser.MINUS, 0); }
		public UnaryExpressionContext(ExpressionContext ctx) { copyFrom(ctx); }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterUnaryExpression(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitUnaryExpression(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitUnaryExpression(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class LiteralExpressionContext extends ExpressionContext {
		public TerminalNode Identifier() { return getToken(OpenQASM3Parser.Identifier, 0); }
		public TerminalNode BinaryIntegerLiteral() { return getToken(OpenQASM3Parser.BinaryIntegerLiteral, 0); }
		public TerminalNode OctalIntegerLiteral() { return getToken(OpenQASM3Parser.OctalIntegerLiteral, 0); }
		public TerminalNode DecimalIntegerLiteral() { return getToken(OpenQASM3Parser.DecimalIntegerLiteral, 0); }
		public TerminalNode HexIntegerLiteral() { return getToken(OpenQASM3Parser.HexIntegerLiteral, 0); }
		public TerminalNode FloatLiteral() { return getToken(OpenQASM3Parser.FloatLiteral, 0); }
		public TerminalNode ImaginaryLiteral() { return getToken(OpenQASM3Parser.ImaginaryLiteral, 0); }
		public TerminalNode BooleanLiteral() { return getToken(OpenQASM3Parser.BooleanLiteral, 0); }
		public TerminalNode BitstringLiteral() { return getToken(OpenQASM3Parser.BitstringLiteral, 0); }
		public TerminalNode TimingLiteral() { return getToken(OpenQASM3Parser.TimingLiteral, 0); }
		public TerminalNode HardwareQubit() { return getToken(OpenQASM3Parser.HardwareQubit, 0); }
		public LiteralExpressionContext(ExpressionContext ctx) { copyFrom(ctx); }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterLiteralExpression(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitLiteralExpression(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitLiteralExpression(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ExpressionContext expression() throws RecognitionException {
		return expression(0);
	}

	private ExpressionContext expression(int _p) throws RecognitionException {
		ParserRuleContext _parentctx = _ctx;
		int _parentState = getState();
		ExpressionContext _localctx = new ExpressionContext(_ctx, _parentState);
		ExpressionContext _prevctx = _localctx;
		int _startState = 76;
		enterRecursionRule(_localctx, 76, RULE_expression, _p);
		int _la;
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			setState(513);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,47,_ctx) ) {
			case 1:
				{
				_localctx = new ParenthesisExpressionContext(_localctx);
				_ctx = _localctx;
				_prevctx = _localctx;

				setState(487);
				match(LPAREN);
				setState(488);
				expression(0);
				setState(489);
				match(RPAREN);
				}
				break;
			case 2:
				{
				_localctx = new UnaryExpressionContext(_localctx);
				_ctx = _localctx;
				_prevctx = _localctx;
				setState(491);
				((UnaryExpressionContext)_localctx).op = _input.LT(1);
				_la = _input.LA(1);
				if ( !(((((_la - 71)) & ~0x3f) == 0 && ((1L << (_la - 71)) & 6145L) != 0)) ) {
					((UnaryExpressionContext)_localctx).op = (Token)_errHandler.recoverInline(this);
				}
				else {
					if ( _input.LA(1)==Token.EOF ) matchedEOF = true;
					_errHandler.reportMatch(this);
					consume();
				}
				setState(492);
				expression(15);
				}
				break;
			case 3:
				{
				_localctx = new CastExpressionContext(_localctx);
				_ctx = _localctx;
				_prevctx = _localctx;
				setState(495);
				_errHandler.sync(this);
				switch (_input.LA(1)) {
				case BOOL:
				case BIT:
				case INT:
				case UINT:
				case FLOAT:
				case ANGLE:
				case COMPLEX:
				case DURATION:
				case STRETCH:
					{
					setState(493);
					scalarType();
					}
					break;
				case ARRAY:
					{
					setState(494);
					arrayType();
					}
					break;
				default:
					throw new NoViableAltException(this);
				}
				setState(497);
				match(LPAREN);
				setState(498);
				expression(0);
				setState(499);
				match(RPAREN);
				}
				break;
			case 4:
				{
				_localctx = new DurationofExpressionContext(_localctx);
				_ctx = _localctx;
				_prevctx = _localctx;
				setState(501);
				match(DURATIONOF);
				setState(502);
				match(LPAREN);
				setState(503);
				scope();
				setState(504);
				match(RPAREN);
				}
				break;
			case 5:
				{
				_localctx = new CallExpressionContext(_localctx);
				_ctx = _localctx;
				_prevctx = _localctx;
				setState(506);
				match(Identifier);
				setState(507);
				match(LPAREN);
				setState(509);
				_errHandler.sync(this);
				_la = _input.LA(1);
				if ((((_la) & ~0x3f) == 0 && ((1L << _la) & 2380183172211015680L) != 0) || ((((_la - 71)) & ~0x3f) == 0 && ((1L << (_la - 71)) & 268179457L) != 0)) {
					{
					setState(508);
					expressionList();
					}
				}

				setState(511);
				match(RPAREN);
				}
				break;
			case 6:
				{
				_localctx = new LiteralExpressionContext(_localctx);
				_ctx = _localctx;
				_prevctx = _localctx;
				setState(512);
				_la = _input.LA(1);
				if ( !(((((_la - 56)) & ~0x3f) == 0 && ((1L << (_la - 56)) & 8787503087617L) != 0)) ) {
				_errHandler.recoverInline(this);
				}
				else {
					if ( _input.LA(1)==Token.EOF ) matchedEOF = true;
					_errHandler.reportMatch(this);
					consume();
				}
				}
				break;
			}
			_ctx.stop = _input.LT(-1);
			setState(552);
			_errHandler.sync(this);
			_alt = getInterpreter().adaptivePredict(_input,49,_ctx);
			while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
				if ( _alt==1 ) {
					if ( _parseListeners!=null ) triggerExitRuleEvent();
					_prevctx = _localctx;
					{
					setState(550);
					_errHandler.sync(this);
					switch ( getInterpreter().adaptivePredict(_input,48,_ctx) ) {
					case 1:
						{
						_localctx = new PowerExpressionContext(new ExpressionContext(_parentctx, _parentState));
						pushNewRecursionContext(_localctx, _startState, RULE_expression);
						setState(515);
						if (!(precpred(_ctx, 16))) throw new FailedPredicateException(this, "precpred(_ctx, 16)");
						setState(516);
						((PowerExpressionContext)_localctx).op = match(DOUBLE_ASTERISK);
						setState(517);
						expression(16);
						}
						break;
					case 2:
						{
						_localctx = new MultiplicativeExpressionContext(new ExpressionContext(_parentctx, _parentState));
						pushNewRecursionContext(_localctx, _startState, RULE_expression);
						setState(518);
						if (!(precpred(_ctx, 14))) throw new FailedPredicateException(this, "precpred(_ctx, 14)");
						setState(519);
						((MultiplicativeExpressionContext)_localctx).op = _input.LT(1);
						_la = _input.LA(1);
						if ( !(((((_la - 72)) & ~0x3f) == 0 && ((1L << (_la - 72)) & 13L) != 0)) ) {
							((MultiplicativeExpressionContext)_localctx).op = (Token)_errHandler.recoverInline(this);
						}
						else {
							if ( _input.LA(1)==Token.EOF ) matchedEOF = true;
							_errHandler.reportMatch(this);
							consume();
						}
						setState(520);
						expression(15);
						}
						break;
					case 3:
						{
						_localctx = new AdditiveExpressionContext(new ExpressionContext(_parentctx, _parentState));
						pushNewRecursionContext(_localctx, _startState, RULE_expression);
						setState(521);
						if (!(precpred(_ctx, 13))) throw new FailedPredicateException(this, "precpred(_ctx, 13)");
						setState(522);
						((AdditiveExpressionContext)_localctx).op = _input.LT(1);
						_la = _input.LA(1);
						if ( !(_la==PLUS || _la==MINUS) ) {
							((AdditiveExpressionContext)_localctx).op = (Token)_errHandler.recoverInline(this);
						}
						else {
							if ( _input.LA(1)==Token.EOF ) matchedEOF = true;
							_errHandler.reportMatch(this);
							consume();
						}
						setState(523);
						expression(14);
						}
						break;
					case 4:
						{
						_localctx = new BitshiftExpressionContext(new ExpressionContext(_parentctx, _parentState));
						pushNewRecursionContext(_localctx, _startState, RULE_expression);
						setState(524);
						if (!(precpred(_ctx, 12))) throw new FailedPredicateException(this, "precpred(_ctx, 12)");
						setState(525);
						((BitshiftExpressionContext)_localctx).op = match(BitshiftOperator);
						setState(526);
						expression(13);
						}
						break;
					case 5:
						{
						_localctx = new ComparisonExpressionContext(new ExpressionContext(_parentctx, _parentState));
						pushNewRecursionContext(_localctx, _startState, RULE_expression);
						setState(527);
						if (!(precpred(_ctx, 11))) throw new FailedPredicateException(this, "precpred(_ctx, 11)");
						setState(528);
						((ComparisonExpressionContext)_localctx).op = match(ComparisonOperator);
						setState(529);
						expression(12);
						}
						break;
					case 6:
						{
						_localctx = new EqualityExpressionContext(new ExpressionContext(_parentctx, _parentState));
						pushNewRecursionContext(_localctx, _startState, RULE_expression);
						setState(530);
						if (!(precpred(_ctx, 10))) throw new FailedPredicateException(this, "precpred(_ctx, 10)");
						setState(531);
						((EqualityExpressionContext)_localctx).op = match(EqualityOperator);
						setState(532);
						expression(11);
						}
						break;
					case 7:
						{
						_localctx = new BitwiseAndExpressionContext(new ExpressionContext(_parentctx, _parentState));
						pushNewRecursionContext(_localctx, _startState, RULE_expression);
						setState(533);
						if (!(precpred(_ctx, 9))) throw new FailedPredicateException(this, "precpred(_ctx, 9)");
						setState(534);
						((BitwiseAndExpressionContext)_localctx).op = match(AMPERSAND);
						setState(535);
						expression(10);
						}
						break;
					case 8:
						{
						_localctx = new BitwiseXorExpressionContext(new ExpressionContext(_parentctx, _parentState));
						pushNewRecursionContext(_localctx, _startState, RULE_expression);
						setState(536);
						if (!(precpred(_ctx, 8))) throw new FailedPredicateException(this, "precpred(_ctx, 8)");
						setState(537);
						((BitwiseXorExpressionContext)_localctx).op = match(CARET);
						setState(538);
						expression(9);
						}
						break;
					case 9:
						{
						_localctx = new BitwiseOrExpressionContext(new ExpressionContext(_parentctx, _parentState));
						pushNewRecursionContext(_localctx, _startState, RULE_expression);
						setState(539);
						if (!(precpred(_ctx, 7))) throw new FailedPredicateException(this, "precpred(_ctx, 7)");
						setState(540);
						((BitwiseOrExpressionContext)_localctx).op = match(PIPE);
						setState(541);
						expression(8);
						}
						break;
					case 10:
						{
						_localctx = new LogicalAndExpressionContext(new ExpressionContext(_parentctx, _parentState));
						pushNewRecursionContext(_localctx, _startState, RULE_expression);
						setState(542);
						if (!(precpred(_ctx, 6))) throw new FailedPredicateException(this, "precpred(_ctx, 6)");
						setState(543);
						((LogicalAndExpressionContext)_localctx).op = match(DOUBLE_AMPERSAND);
						setState(544);
						expression(7);
						}
						break;
					case 11:
						{
						_localctx = new LogicalOrExpressionContext(new ExpressionContext(_parentctx, _parentState));
						pushNewRecursionContext(_localctx, _startState, RULE_expression);
						setState(545);
						if (!(precpred(_ctx, 5))) throw new FailedPredicateException(this, "precpred(_ctx, 5)");
						setState(546);
						((LogicalOrExpressionContext)_localctx).op = match(DOUBLE_PIPE);
						setState(547);
						expression(6);
						}
						break;
					case 12:
						{
						_localctx = new IndexExpressionContext(new ExpressionContext(_parentctx, _parentState));
						pushNewRecursionContext(_localctx, _startState, RULE_expression);
						setState(548);
						if (!(precpred(_ctx, 17))) throw new FailedPredicateException(this, "precpred(_ctx, 17)");
						setState(549);
						indexOperator();
						}
						break;
					}
					} 
				}
				setState(554);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,49,_ctx);
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			unrollRecursionContexts(_parentctx);
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class AliasExpressionContext extends ParserRuleContext {
		public List<ExpressionContext> expression() {
			return getRuleContexts(ExpressionContext.class);
		}
		public ExpressionContext expression(int i) {
			return getRuleContext(ExpressionContext.class,i);
		}
		public List<TerminalNode> DOUBLE_PLUS() { return getTokens(OpenQASM3Parser.DOUBLE_PLUS); }
		public TerminalNode DOUBLE_PLUS(int i) {
			return getToken(OpenQASM3Parser.DOUBLE_PLUS, i);
		}
		public AliasExpressionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_aliasExpression; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterAliasExpression(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitAliasExpression(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitAliasExpression(this);
			else return visitor.visitChildren(this);
		}
	}

	public final AliasExpressionContext aliasExpression() throws RecognitionException {
		AliasExpressionContext _localctx = new AliasExpressionContext(_ctx, getState());
		enterRule(_localctx, 78, RULE_aliasExpression);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(555);
			expression(0);
			setState(560);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==DOUBLE_PLUS) {
				{
				{
				setState(556);
				match(DOUBLE_PLUS);
				setState(557);
				expression(0);
				}
				}
				setState(562);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class DeclarationExpressionContext extends ParserRuleContext {
		public ArrayLiteralContext arrayLiteral() {
			return getRuleContext(ArrayLiteralContext.class,0);
		}
		public ExpressionContext expression() {
			return getRuleContext(ExpressionContext.class,0);
		}
		public MeasureExpressionContext measureExpression() {
			return getRuleContext(MeasureExpressionContext.class,0);
		}
		public QuantumCallExpressionContext quantumCallExpression() {
			return getRuleContext(QuantumCallExpressionContext.class,0);
		}
		public DeclarationExpressionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_declarationExpression; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterDeclarationExpression(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitDeclarationExpression(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitDeclarationExpression(this);
			else return visitor.visitChildren(this);
		}
	}

	public final DeclarationExpressionContext declarationExpression() throws RecognitionException {
		DeclarationExpressionContext _localctx = new DeclarationExpressionContext(_ctx, getState());
		enterRule(_localctx, 80, RULE_declarationExpression);
		try {
			setState(567);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,51,_ctx) ) {
			case 1:
				enterOuterAlt(_localctx, 1);
				{
				setState(563);
				arrayLiteral();
				}
				break;
			case 2:
				enterOuterAlt(_localctx, 2);
				{
				setState(564);
				expression(0);
				}
				break;
			case 3:
				enterOuterAlt(_localctx, 3);
				{
				setState(565);
				measureExpression();
				}
				break;
			case 4:
				enterOuterAlt(_localctx, 4);
				{
				setState(566);
				quantumCallExpression();
				}
				break;
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class MeasureExpressionContext extends ParserRuleContext {
		public TerminalNode MEASURE() { return getToken(OpenQASM3Parser.MEASURE, 0); }
		public GateOperandContext gateOperand() {
			return getRuleContext(GateOperandContext.class,0);
		}
		public MeasureExpressionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_measureExpression; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterMeasureExpression(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitMeasureExpression(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitMeasureExpression(this);
			else return visitor.visitChildren(this);
		}
	}

	public final MeasureExpressionContext measureExpression() throws RecognitionException {
		MeasureExpressionContext _localctx = new MeasureExpressionContext(_ctx, getState());
		enterRule(_localctx, 82, RULE_measureExpression);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(569);
			match(MEASURE);
			setState(570);
			gateOperand();
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class QuantumCallExpressionContext extends ParserRuleContext {
		public TerminalNode Identifier() { return getToken(OpenQASM3Parser.Identifier, 0); }
		public GateOperandListContext gateOperandList() {
			return getRuleContext(GateOperandListContext.class,0);
		}
		public TerminalNode LPAREN() { return getToken(OpenQASM3Parser.LPAREN, 0); }
		public TerminalNode RPAREN() { return getToken(OpenQASM3Parser.RPAREN, 0); }
		public ExpressionListContext expressionList() {
			return getRuleContext(ExpressionListContext.class,0);
		}
		public QuantumCallExpressionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_quantumCallExpression; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterQuantumCallExpression(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitQuantumCallExpression(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitQuantumCallExpression(this);
			else return visitor.visitChildren(this);
		}
	}

	public final QuantumCallExpressionContext quantumCallExpression() throws RecognitionException {
		QuantumCallExpressionContext _localctx = new QuantumCallExpressionContext(_ctx, getState());
		enterRule(_localctx, 84, RULE_quantumCallExpression);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(572);
			match(Identifier);
			setState(578);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==LPAREN) {
				{
				setState(573);
				match(LPAREN);
				setState(575);
				_errHandler.sync(this);
				_la = _input.LA(1);
				if ((((_la) & ~0x3f) == 0 && ((1L << _la) & 2380183172211015680L) != 0) || ((((_la - 71)) & ~0x3f) == 0 && ((1L << (_la - 71)) & 268179457L) != 0)) {
					{
					setState(574);
					expressionList();
					}
				}

				setState(577);
				match(RPAREN);
				}
			}

			setState(580);
			gateOperandList();
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class RangeExpressionContext extends ParserRuleContext {
		public List<TerminalNode> COLON() { return getTokens(OpenQASM3Parser.COLON); }
		public TerminalNode COLON(int i) {
			return getToken(OpenQASM3Parser.COLON, i);
		}
		public List<ExpressionContext> expression() {
			return getRuleContexts(ExpressionContext.class);
		}
		public ExpressionContext expression(int i) {
			return getRuleContext(ExpressionContext.class,i);
		}
		public RangeExpressionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_rangeExpression; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterRangeExpression(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitRangeExpression(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitRangeExpression(this);
			else return visitor.visitChildren(this);
		}
	}

	public final RangeExpressionContext rangeExpression() throws RecognitionException {
		RangeExpressionContext _localctx = new RangeExpressionContext(_ctx, getState());
		enterRule(_localctx, 86, RULE_rangeExpression);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(583);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if ((((_la) & ~0x3f) == 0 && ((1L << _la) & 2380183172211015680L) != 0) || ((((_la - 71)) & ~0x3f) == 0 && ((1L << (_la - 71)) & 268179457L) != 0)) {
				{
				setState(582);
				expression(0);
				}
			}

			setState(585);
			match(COLON);
			setState(587);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if ((((_la) & ~0x3f) == 0 && ((1L << _la) & 2380183172211015680L) != 0) || ((((_la - 71)) & ~0x3f) == 0 && ((1L << (_la - 71)) & 268179457L) != 0)) {
				{
				setState(586);
				expression(0);
				}
			}

			setState(591);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==COLON) {
				{
				setState(589);
				match(COLON);
				setState(590);
				expression(0);
				}
			}

			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class SetExpressionContext extends ParserRuleContext {
		public TerminalNode LBRACE() { return getToken(OpenQASM3Parser.LBRACE, 0); }
		public List<ExpressionContext> expression() {
			return getRuleContexts(ExpressionContext.class);
		}
		public ExpressionContext expression(int i) {
			return getRuleContext(ExpressionContext.class,i);
		}
		public TerminalNode RBRACE() { return getToken(OpenQASM3Parser.RBRACE, 0); }
		public List<TerminalNode> COMMA() { return getTokens(OpenQASM3Parser.COMMA); }
		public TerminalNode COMMA(int i) {
			return getToken(OpenQASM3Parser.COMMA, i);
		}
		public SetExpressionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_setExpression; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterSetExpression(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitSetExpression(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitSetExpression(this);
			else return visitor.visitChildren(this);
		}
	}

	public final SetExpressionContext setExpression() throws RecognitionException {
		SetExpressionContext _localctx = new SetExpressionContext(_ctx, getState());
		enterRule(_localctx, 88, RULE_setExpression);
		int _la;
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			setState(593);
			match(LBRACE);
			setState(594);
			expression(0);
			setState(599);
			_errHandler.sync(this);
			_alt = getInterpreter().adaptivePredict(_input,57,_ctx);
			while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
				if ( _alt==1 ) {
					{
					{
					setState(595);
					match(COMMA);
					setState(596);
					expression(0);
					}
					} 
				}
				setState(601);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,57,_ctx);
			}
			setState(603);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==COMMA) {
				{
				setState(602);
				match(COMMA);
				}
			}

			setState(605);
			match(RBRACE);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ArrayLiteralContext extends ParserRuleContext {
		public TerminalNode LBRACE() { return getToken(OpenQASM3Parser.LBRACE, 0); }
		public TerminalNode RBRACE() { return getToken(OpenQASM3Parser.RBRACE, 0); }
		public List<ExpressionContext> expression() {
			return getRuleContexts(ExpressionContext.class);
		}
		public ExpressionContext expression(int i) {
			return getRuleContext(ExpressionContext.class,i);
		}
		public List<ArrayLiteralContext> arrayLiteral() {
			return getRuleContexts(ArrayLiteralContext.class);
		}
		public ArrayLiteralContext arrayLiteral(int i) {
			return getRuleContext(ArrayLiteralContext.class,i);
		}
		public List<TerminalNode> COMMA() { return getTokens(OpenQASM3Parser.COMMA); }
		public TerminalNode COMMA(int i) {
			return getToken(OpenQASM3Parser.COMMA, i);
		}
		public ArrayLiteralContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_arrayLiteral; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterArrayLiteral(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitArrayLiteral(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitArrayLiteral(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ArrayLiteralContext arrayLiteral() throws RecognitionException {
		ArrayLiteralContext _localctx = new ArrayLiteralContext(_ctx, getState());
		enterRule(_localctx, 90, RULE_arrayLiteral);
		int _la;
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			setState(607);
			match(LBRACE);
			setState(625);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if ((((_la) & ~0x3f) == 0 && ((1L << _la) & 2956643924514439168L) != 0) || ((((_la - 71)) & ~0x3f) == 0 && ((1L << (_la - 71)) & 268179457L) != 0)) {
				{
				setState(610);
				_errHandler.sync(this);
				switch (_input.LA(1)) {
				case BOOL:
				case BIT:
				case INT:
				case UINT:
				case FLOAT:
				case ANGLE:
				case COMPLEX:
				case ARRAY:
				case DURATION:
				case STRETCH:
				case DURATIONOF:
				case BooleanLiteral:
				case LPAREN:
				case MINUS:
				case TILDE:
				case EXCLAMATION_POINT:
				case ImaginaryLiteral:
				case BinaryIntegerLiteral:
				case OctalIntegerLiteral:
				case DecimalIntegerLiteral:
				case HexIntegerLiteral:
				case Identifier:
				case HardwareQubit:
				case FloatLiteral:
				case TimingLiteral:
				case BitstringLiteral:
					{
					setState(608);
					expression(0);
					}
					break;
				case LBRACE:
					{
					setState(609);
					arrayLiteral();
					}
					break;
				default:
					throw new NoViableAltException(this);
				}
				setState(619);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,61,_ctx);
				while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
					if ( _alt==1 ) {
						{
						{
						setState(612);
						match(COMMA);
						setState(615);
						_errHandler.sync(this);
						switch (_input.LA(1)) {
						case BOOL:
						case BIT:
						case INT:
						case UINT:
						case FLOAT:
						case ANGLE:
						case COMPLEX:
						case ARRAY:
						case DURATION:
						case STRETCH:
						case DURATIONOF:
						case BooleanLiteral:
						case LPAREN:
						case MINUS:
						case TILDE:
						case EXCLAMATION_POINT:
						case ImaginaryLiteral:
						case BinaryIntegerLiteral:
						case OctalIntegerLiteral:
						case DecimalIntegerLiteral:
						case HexIntegerLiteral:
						case Identifier:
						case HardwareQubit:
						case FloatLiteral:
						case TimingLiteral:
						case BitstringLiteral:
							{
							setState(613);
							expression(0);
							}
							break;
						case LBRACE:
							{
							setState(614);
							arrayLiteral();
							}
							break;
						default:
							throw new NoViableAltException(this);
						}
						}
						} 
					}
					setState(621);
					_errHandler.sync(this);
					_alt = getInterpreter().adaptivePredict(_input,61,_ctx);
				}
				setState(623);
				_errHandler.sync(this);
				_la = _input.LA(1);
				if (_la==COMMA) {
					{
					setState(622);
					match(COMMA);
					}
				}

				}
			}

			setState(627);
			match(RBRACE);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class IndexOperatorContext extends ParserRuleContext {
		public TerminalNode LBRACKET() { return getToken(OpenQASM3Parser.LBRACKET, 0); }
		public TerminalNode RBRACKET() { return getToken(OpenQASM3Parser.RBRACKET, 0); }
		public SetExpressionContext setExpression() {
			return getRuleContext(SetExpressionContext.class,0);
		}
		public List<ExpressionContext> expression() {
			return getRuleContexts(ExpressionContext.class);
		}
		public ExpressionContext expression(int i) {
			return getRuleContext(ExpressionContext.class,i);
		}
		public List<RangeExpressionContext> rangeExpression() {
			return getRuleContexts(RangeExpressionContext.class);
		}
		public RangeExpressionContext rangeExpression(int i) {
			return getRuleContext(RangeExpressionContext.class,i);
		}
		public List<TerminalNode> COMMA() { return getTokens(OpenQASM3Parser.COMMA); }
		public TerminalNode COMMA(int i) {
			return getToken(OpenQASM3Parser.COMMA, i);
		}
		public IndexOperatorContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_indexOperator; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterIndexOperator(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitIndexOperator(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitIndexOperator(this);
			else return visitor.visitChildren(this);
		}
	}

	public final IndexOperatorContext indexOperator() throws RecognitionException {
		IndexOperatorContext _localctx = new IndexOperatorContext(_ctx, getState());
		enterRule(_localctx, 92, RULE_indexOperator);
		int _la;
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			setState(629);
			match(LBRACKET);
			setState(648);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case LBRACE:
				{
				setState(630);
				setExpression();
				}
				break;
			case BOOL:
			case BIT:
			case INT:
			case UINT:
			case FLOAT:
			case ANGLE:
			case COMPLEX:
			case ARRAY:
			case DURATION:
			case STRETCH:
			case DURATIONOF:
			case BooleanLiteral:
			case LPAREN:
			case COLON:
			case MINUS:
			case TILDE:
			case EXCLAMATION_POINT:
			case ImaginaryLiteral:
			case BinaryIntegerLiteral:
			case OctalIntegerLiteral:
			case DecimalIntegerLiteral:
			case HexIntegerLiteral:
			case Identifier:
			case HardwareQubit:
			case FloatLiteral:
			case TimingLiteral:
			case BitstringLiteral:
				{
				setState(633);
				_errHandler.sync(this);
				switch ( getInterpreter().adaptivePredict(_input,64,_ctx) ) {
				case 1:
					{
					setState(631);
					expression(0);
					}
					break;
				case 2:
					{
					setState(632);
					rangeExpression();
					}
					break;
				}
				setState(642);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,66,_ctx);
				while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
					if ( _alt==1 ) {
						{
						{
						setState(635);
						match(COMMA);
						setState(638);
						_errHandler.sync(this);
						switch ( getInterpreter().adaptivePredict(_input,65,_ctx) ) {
						case 1:
							{
							setState(636);
							expression(0);
							}
							break;
						case 2:
							{
							setState(637);
							rangeExpression();
							}
							break;
						}
						}
						} 
					}
					setState(644);
					_errHandler.sync(this);
					_alt = getInterpreter().adaptivePredict(_input,66,_ctx);
				}
				setState(646);
				_errHandler.sync(this);
				_la = _input.LA(1);
				if (_la==COMMA) {
					{
					setState(645);
					match(COMMA);
					}
				}

				}
				break;
			default:
				throw new NoViableAltException(this);
			}
			setState(650);
			match(RBRACKET);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class IndexedIdentifierContext extends ParserRuleContext {
		public TerminalNode Identifier() { return getToken(OpenQASM3Parser.Identifier, 0); }
		public List<IndexOperatorContext> indexOperator() {
			return getRuleContexts(IndexOperatorContext.class);
		}
		public IndexOperatorContext indexOperator(int i) {
			return getRuleContext(IndexOperatorContext.class,i);
		}
		public IndexedIdentifierContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_indexedIdentifier; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterIndexedIdentifier(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitIndexedIdentifier(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitIndexedIdentifier(this);
			else return visitor.visitChildren(this);
		}
	}

	public final IndexedIdentifierContext indexedIdentifier() throws RecognitionException {
		IndexedIdentifierContext _localctx = new IndexedIdentifierContext(_ctx, getState());
		enterRule(_localctx, 94, RULE_indexedIdentifier);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(652);
			match(Identifier);
			setState(656);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==LBRACKET) {
				{
				{
				setState(653);
				indexOperator();
				}
				}
				setState(658);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ReturnSignatureContext extends ParserRuleContext {
		public TerminalNode ARROW() { return getToken(OpenQASM3Parser.ARROW, 0); }
		public ScalarTypeContext scalarType() {
			return getRuleContext(ScalarTypeContext.class,0);
		}
		public ReturnSignatureContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_returnSignature; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterReturnSignature(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitReturnSignature(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitReturnSignature(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ReturnSignatureContext returnSignature() throws RecognitionException {
		ReturnSignatureContext _localctx = new ReturnSignatureContext(_ctx, getState());
		enterRule(_localctx, 96, RULE_returnSignature);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(659);
			match(ARROW);
			setState(660);
			scalarType();
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class GateModifierContext extends ParserRuleContext {
		public TerminalNode AT() { return getToken(OpenQASM3Parser.AT, 0); }
		public TerminalNode INV() { return getToken(OpenQASM3Parser.INV, 0); }
		public TerminalNode POW() { return getToken(OpenQASM3Parser.POW, 0); }
		public TerminalNode LPAREN() { return getToken(OpenQASM3Parser.LPAREN, 0); }
		public ExpressionContext expression() {
			return getRuleContext(ExpressionContext.class,0);
		}
		public TerminalNode RPAREN() { return getToken(OpenQASM3Parser.RPAREN, 0); }
		public TerminalNode CTRL() { return getToken(OpenQASM3Parser.CTRL, 0); }
		public TerminalNode NEGCTRL() { return getToken(OpenQASM3Parser.NEGCTRL, 0); }
		public GateModifierContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_gateModifier; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterGateModifier(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitGateModifier(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitGateModifier(this);
			else return visitor.visitChildren(this);
		}
	}

	public final GateModifierContext gateModifier() throws RecognitionException {
		GateModifierContext _localctx = new GateModifierContext(_ctx, getState());
		enterRule(_localctx, 98, RULE_gateModifier);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(675);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case INV:
				{
				setState(662);
				match(INV);
				}
				break;
			case POW:
				{
				setState(663);
				match(POW);
				setState(664);
				match(LPAREN);
				setState(665);
				expression(0);
				setState(666);
				match(RPAREN);
				}
				break;
			case CTRL:
			case NEGCTRL:
				{
				setState(668);
				_la = _input.LA(1);
				if ( !(_la==CTRL || _la==NEGCTRL) ) {
				_errHandler.recoverInline(this);
				}
				else {
					if ( _input.LA(1)==Token.EOF ) matchedEOF = true;
					_errHandler.reportMatch(this);
					consume();
				}
				setState(673);
				_errHandler.sync(this);
				_la = _input.LA(1);
				if (_la==LPAREN) {
					{
					setState(669);
					match(LPAREN);
					setState(670);
					expression(0);
					setState(671);
					match(RPAREN);
					}
				}

				}
				break;
			default:
				throw new NoViableAltException(this);
			}
			setState(677);
			match(AT);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ScalarTypeContext extends ParserRuleContext {
		public TerminalNode BIT() { return getToken(OpenQASM3Parser.BIT, 0); }
		public DesignatorContext designator() {
			return getRuleContext(DesignatorContext.class,0);
		}
		public TerminalNode INT() { return getToken(OpenQASM3Parser.INT, 0); }
		public TerminalNode UINT() { return getToken(OpenQASM3Parser.UINT, 0); }
		public TerminalNode FLOAT() { return getToken(OpenQASM3Parser.FLOAT, 0); }
		public TerminalNode ANGLE() { return getToken(OpenQASM3Parser.ANGLE, 0); }
		public TerminalNode BOOL() { return getToken(OpenQASM3Parser.BOOL, 0); }
		public TerminalNode DURATION() { return getToken(OpenQASM3Parser.DURATION, 0); }
		public TerminalNode STRETCH() { return getToken(OpenQASM3Parser.STRETCH, 0); }
		public TerminalNode COMPLEX() { return getToken(OpenQASM3Parser.COMPLEX, 0); }
		public TerminalNode LBRACKET() { return getToken(OpenQASM3Parser.LBRACKET, 0); }
		public ScalarTypeContext scalarType() {
			return getRuleContext(ScalarTypeContext.class,0);
		}
		public TerminalNode RBRACKET() { return getToken(OpenQASM3Parser.RBRACKET, 0); }
		public ScalarTypeContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_scalarType; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterScalarType(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitScalarType(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitScalarType(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ScalarTypeContext scalarType() throws RecognitionException {
		ScalarTypeContext _localctx = new ScalarTypeContext(_ctx, getState());
		enterRule(_localctx, 100, RULE_scalarType);
		int _la;
		try {
			setState(709);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case BIT:
				enterOuterAlt(_localctx, 1);
				{
				setState(679);
				match(BIT);
				setState(681);
				_errHandler.sync(this);
				_la = _input.LA(1);
				if (_la==LBRACKET) {
					{
					setState(680);
					designator();
					}
				}

				}
				break;
			case INT:
				enterOuterAlt(_localctx, 2);
				{
				setState(683);
				match(INT);
				setState(685);
				_errHandler.sync(this);
				_la = _input.LA(1);
				if (_la==LBRACKET) {
					{
					setState(684);
					designator();
					}
				}

				}
				break;
			case UINT:
				enterOuterAlt(_localctx, 3);
				{
				setState(687);
				match(UINT);
				setState(689);
				_errHandler.sync(this);
				_la = _input.LA(1);
				if (_la==LBRACKET) {
					{
					setState(688);
					designator();
					}
				}

				}
				break;
			case FLOAT:
				enterOuterAlt(_localctx, 4);
				{
				setState(691);
				match(FLOAT);
				setState(693);
				_errHandler.sync(this);
				_la = _input.LA(1);
				if (_la==LBRACKET) {
					{
					setState(692);
					designator();
					}
				}

				}
				break;
			case ANGLE:
				enterOuterAlt(_localctx, 5);
				{
				setState(695);
				match(ANGLE);
				setState(697);
				_errHandler.sync(this);
				_la = _input.LA(1);
				if (_la==LBRACKET) {
					{
					setState(696);
					designator();
					}
				}

				}
				break;
			case BOOL:
				enterOuterAlt(_localctx, 6);
				{
				setState(699);
				match(BOOL);
				}
				break;
			case DURATION:
				enterOuterAlt(_localctx, 7);
				{
				setState(700);
				match(DURATION);
				}
				break;
			case STRETCH:
				enterOuterAlt(_localctx, 8);
				{
				setState(701);
				match(STRETCH);
				}
				break;
			case COMPLEX:
				enterOuterAlt(_localctx, 9);
				{
				setState(702);
				match(COMPLEX);
				setState(707);
				_errHandler.sync(this);
				_la = _input.LA(1);
				if (_la==LBRACKET) {
					{
					setState(703);
					match(LBRACKET);
					setState(704);
					scalarType();
					setState(705);
					match(RBRACKET);
					}
				}

				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class QubitTypeContext extends ParserRuleContext {
		public TerminalNode QUBIT() { return getToken(OpenQASM3Parser.QUBIT, 0); }
		public DesignatorContext designator() {
			return getRuleContext(DesignatorContext.class,0);
		}
		public QubitTypeContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_qubitType; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterQubitType(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitQubitType(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitQubitType(this);
			else return visitor.visitChildren(this);
		}
	}

	public final QubitTypeContext qubitType() throws RecognitionException {
		QubitTypeContext _localctx = new QubitTypeContext(_ctx, getState());
		enterRule(_localctx, 102, RULE_qubitType);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(711);
			match(QUBIT);
			setState(713);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==LBRACKET) {
				{
				setState(712);
				designator();
				}
			}

			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ArrayTypeContext extends ParserRuleContext {
		public TerminalNode ARRAY() { return getToken(OpenQASM3Parser.ARRAY, 0); }
		public TerminalNode LBRACKET() { return getToken(OpenQASM3Parser.LBRACKET, 0); }
		public ScalarTypeContext scalarType() {
			return getRuleContext(ScalarTypeContext.class,0);
		}
		public TerminalNode COMMA() { return getToken(OpenQASM3Parser.COMMA, 0); }
		public ExpressionListContext expressionList() {
			return getRuleContext(ExpressionListContext.class,0);
		}
		public TerminalNode RBRACKET() { return getToken(OpenQASM3Parser.RBRACKET, 0); }
		public ArrayTypeContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_arrayType; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterArrayType(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitArrayType(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitArrayType(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ArrayTypeContext arrayType() throws RecognitionException {
		ArrayTypeContext _localctx = new ArrayTypeContext(_ctx, getState());
		enterRule(_localctx, 104, RULE_arrayType);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(715);
			match(ARRAY);
			setState(716);
			match(LBRACKET);
			setState(717);
			scalarType();
			setState(718);
			match(COMMA);
			setState(719);
			expressionList();
			setState(720);
			match(RBRACKET);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ArrayReferenceTypeContext extends ParserRuleContext {
		public TerminalNode ARRAY() { return getToken(OpenQASM3Parser.ARRAY, 0); }
		public TerminalNode LBRACKET() { return getToken(OpenQASM3Parser.LBRACKET, 0); }
		public ScalarTypeContext scalarType() {
			return getRuleContext(ScalarTypeContext.class,0);
		}
		public TerminalNode COMMA() { return getToken(OpenQASM3Parser.COMMA, 0); }
		public TerminalNode RBRACKET() { return getToken(OpenQASM3Parser.RBRACKET, 0); }
		public TerminalNode READONLY() { return getToken(OpenQASM3Parser.READONLY, 0); }
		public TerminalNode MUTABLE() { return getToken(OpenQASM3Parser.MUTABLE, 0); }
		public ExpressionListContext expressionList() {
			return getRuleContext(ExpressionListContext.class,0);
		}
		public TerminalNode DIM() { return getToken(OpenQASM3Parser.DIM, 0); }
		public TerminalNode EQUALS() { return getToken(OpenQASM3Parser.EQUALS, 0); }
		public ExpressionContext expression() {
			return getRuleContext(ExpressionContext.class,0);
		}
		public ArrayReferenceTypeContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_arrayReferenceType; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterArrayReferenceType(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitArrayReferenceType(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitArrayReferenceType(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ArrayReferenceTypeContext arrayReferenceType() throws RecognitionException {
		ArrayReferenceTypeContext _localctx = new ArrayReferenceTypeContext(_ctx, getState());
		enterRule(_localctx, 106, RULE_arrayReferenceType);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(722);
			_la = _input.LA(1);
			if ( !(_la==READONLY || _la==MUTABLE) ) {
			_errHandler.recoverInline(this);
			}
			else {
				if ( _input.LA(1)==Token.EOF ) matchedEOF = true;
				_errHandler.reportMatch(this);
				consume();
			}
			setState(723);
			match(ARRAY);
			setState(724);
			match(LBRACKET);
			setState(725);
			scalarType();
			setState(726);
			match(COMMA);
			setState(731);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case BOOL:
			case BIT:
			case INT:
			case UINT:
			case FLOAT:
			case ANGLE:
			case COMPLEX:
			case ARRAY:
			case DURATION:
			case STRETCH:
			case DURATIONOF:
			case BooleanLiteral:
			case LPAREN:
			case MINUS:
			case TILDE:
			case EXCLAMATION_POINT:
			case ImaginaryLiteral:
			case BinaryIntegerLiteral:
			case OctalIntegerLiteral:
			case DecimalIntegerLiteral:
			case HexIntegerLiteral:
			case Identifier:
			case HardwareQubit:
			case FloatLiteral:
			case TimingLiteral:
			case BitstringLiteral:
				{
				setState(727);
				expressionList();
				}
				break;
			case DIM:
				{
				setState(728);
				match(DIM);
				setState(729);
				match(EQUALS);
				setState(730);
				expression(0);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
			setState(733);
			match(RBRACKET);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class DesignatorContext extends ParserRuleContext {
		public TerminalNode LBRACKET() { return getToken(OpenQASM3Parser.LBRACKET, 0); }
		public ExpressionContext expression() {
			return getRuleContext(ExpressionContext.class,0);
		}
		public TerminalNode RBRACKET() { return getToken(OpenQASM3Parser.RBRACKET, 0); }
		public DesignatorContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_designator; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterDesignator(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitDesignator(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitDesignator(this);
			else return visitor.visitChildren(this);
		}
	}

	public final DesignatorContext designator() throws RecognitionException {
		DesignatorContext _localctx = new DesignatorContext(_ctx, getState());
		enterRule(_localctx, 108, RULE_designator);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(735);
			match(LBRACKET);
			setState(736);
			expression(0);
			setState(737);
			match(RBRACKET);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class DefcalTargetContext extends ParserRuleContext {
		public TerminalNode MEASURE() { return getToken(OpenQASM3Parser.MEASURE, 0); }
		public TerminalNode RESET() { return getToken(OpenQASM3Parser.RESET, 0); }
		public TerminalNode DELAY() { return getToken(OpenQASM3Parser.DELAY, 0); }
		public TerminalNode Identifier() { return getToken(OpenQASM3Parser.Identifier, 0); }
		public DefcalTargetContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_defcalTarget; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterDefcalTarget(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitDefcalTarget(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitDefcalTarget(this);
			else return visitor.visitChildren(this);
		}
	}

	public final DefcalTargetContext defcalTarget() throws RecognitionException {
		DefcalTargetContext _localctx = new DefcalTargetContext(_ctx, getState());
		enterRule(_localctx, 110, RULE_defcalTarget);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(739);
			_la = _input.LA(1);
			if ( !(((((_la - 52)) & ~0x3f) == 0 && ((1L << (_la - 52)) & 4398046511111L) != 0)) ) {
			_errHandler.recoverInline(this);
			}
			else {
				if ( _input.LA(1)==Token.EOF ) matchedEOF = true;
				_errHandler.reportMatch(this);
				consume();
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class DefcalArgumentDefinitionContext extends ParserRuleContext {
		public ExpressionContext expression() {
			return getRuleContext(ExpressionContext.class,0);
		}
		public ArgumentDefinitionContext argumentDefinition() {
			return getRuleContext(ArgumentDefinitionContext.class,0);
		}
		public DefcalArgumentDefinitionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_defcalArgumentDefinition; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterDefcalArgumentDefinition(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitDefcalArgumentDefinition(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitDefcalArgumentDefinition(this);
			else return visitor.visitChildren(this);
		}
	}

	public final DefcalArgumentDefinitionContext defcalArgumentDefinition() throws RecognitionException {
		DefcalArgumentDefinitionContext _localctx = new DefcalArgumentDefinitionContext(_ctx, getState());
		enterRule(_localctx, 112, RULE_defcalArgumentDefinition);
		try {
			setState(743);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,81,_ctx) ) {
			case 1:
				enterOuterAlt(_localctx, 1);
				{
				setState(741);
				expression(0);
				}
				break;
			case 2:
				enterOuterAlt(_localctx, 2);
				{
				setState(742);
				argumentDefinition();
				}
				break;
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class DefcalOperandContext extends ParserRuleContext {
		public TerminalNode HardwareQubit() { return getToken(OpenQASM3Parser.HardwareQubit, 0); }
		public TerminalNode Identifier() { return getToken(OpenQASM3Parser.Identifier, 0); }
		public DefcalOperandContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_defcalOperand; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterDefcalOperand(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitDefcalOperand(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitDefcalOperand(this);
			else return visitor.visitChildren(this);
		}
	}

	public final DefcalOperandContext defcalOperand() throws RecognitionException {
		DefcalOperandContext _localctx = new DefcalOperandContext(_ctx, getState());
		enterRule(_localctx, 114, RULE_defcalOperand);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(745);
			_la = _input.LA(1);
			if ( !(_la==Identifier || _la==HardwareQubit) ) {
			_errHandler.recoverInline(this);
			}
			else {
				if ( _input.LA(1)==Token.EOF ) matchedEOF = true;
				_errHandler.reportMatch(this);
				consume();
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class GateOperandContext extends ParserRuleContext {
		public IndexedIdentifierContext indexedIdentifier() {
			return getRuleContext(IndexedIdentifierContext.class,0);
		}
		public TerminalNode HardwareQubit() { return getToken(OpenQASM3Parser.HardwareQubit, 0); }
		public GateOperandContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_gateOperand; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterGateOperand(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitGateOperand(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitGateOperand(this);
			else return visitor.visitChildren(this);
		}
	}

	public final GateOperandContext gateOperand() throws RecognitionException {
		GateOperandContext _localctx = new GateOperandContext(_ctx, getState());
		enterRule(_localctx, 116, RULE_gateOperand);
		try {
			setState(749);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case Identifier:
				enterOuterAlt(_localctx, 1);
				{
				setState(747);
				indexedIdentifier();
				}
				break;
			case HardwareQubit:
				enterOuterAlt(_localctx, 2);
				{
				setState(748);
				match(HardwareQubit);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ExternArgumentContext extends ParserRuleContext {
		public ScalarTypeContext scalarType() {
			return getRuleContext(ScalarTypeContext.class,0);
		}
		public ArrayReferenceTypeContext arrayReferenceType() {
			return getRuleContext(ArrayReferenceTypeContext.class,0);
		}
		public TerminalNode CREG() { return getToken(OpenQASM3Parser.CREG, 0); }
		public DesignatorContext designator() {
			return getRuleContext(DesignatorContext.class,0);
		}
		public ExternArgumentContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_externArgument; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterExternArgument(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitExternArgument(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitExternArgument(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ExternArgumentContext externArgument() throws RecognitionException {
		ExternArgumentContext _localctx = new ExternArgumentContext(_ctx, getState());
		enterRule(_localctx, 118, RULE_externArgument);
		int _la;
		try {
			setState(757);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case BOOL:
			case BIT:
			case INT:
			case UINT:
			case FLOAT:
			case ANGLE:
			case COMPLEX:
			case DURATION:
			case STRETCH:
				enterOuterAlt(_localctx, 1);
				{
				setState(751);
				scalarType();
				}
				break;
			case READONLY:
			case MUTABLE:
				enterOuterAlt(_localctx, 2);
				{
				setState(752);
				arrayReferenceType();
				}
				break;
			case CREG:
				enterOuterAlt(_localctx, 3);
				{
				setState(753);
				match(CREG);
				setState(755);
				_errHandler.sync(this);
				_la = _input.LA(1);
				if (_la==LBRACKET) {
					{
					setState(754);
					designator();
					}
				}

				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ArgumentDefinitionContext extends ParserRuleContext {
		public ScalarTypeContext scalarType() {
			return getRuleContext(ScalarTypeContext.class,0);
		}
		public TerminalNode Identifier() { return getToken(OpenQASM3Parser.Identifier, 0); }
		public QubitTypeContext qubitType() {
			return getRuleContext(QubitTypeContext.class,0);
		}
		public TerminalNode CREG() { return getToken(OpenQASM3Parser.CREG, 0); }
		public TerminalNode QREG() { return getToken(OpenQASM3Parser.QREG, 0); }
		public DesignatorContext designator() {
			return getRuleContext(DesignatorContext.class,0);
		}
		public ArrayReferenceTypeContext arrayReferenceType() {
			return getRuleContext(ArrayReferenceTypeContext.class,0);
		}
		public ArgumentDefinitionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_argumentDefinition; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterArgumentDefinition(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitArgumentDefinition(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitArgumentDefinition(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ArgumentDefinitionContext argumentDefinition() throws RecognitionException {
		ArgumentDefinitionContext _localctx = new ArgumentDefinitionContext(_ctx, getState());
		enterRule(_localctx, 120, RULE_argumentDefinition);
		int _la;
		try {
			setState(773);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case BOOL:
			case BIT:
			case INT:
			case UINT:
			case FLOAT:
			case ANGLE:
			case COMPLEX:
			case DURATION:
			case STRETCH:
				enterOuterAlt(_localctx, 1);
				{
				setState(759);
				scalarType();
				setState(760);
				match(Identifier);
				}
				break;
			case QUBIT:
				enterOuterAlt(_localctx, 2);
				{
				setState(762);
				qubitType();
				setState(763);
				match(Identifier);
				}
				break;
			case QREG:
			case CREG:
				enterOuterAlt(_localctx, 3);
				{
				setState(765);
				_la = _input.LA(1);
				if ( !(_la==QREG || _la==CREG) ) {
				_errHandler.recoverInline(this);
				}
				else {
					if ( _input.LA(1)==Token.EOF ) matchedEOF = true;
					_errHandler.reportMatch(this);
					consume();
				}
				setState(766);
				match(Identifier);
				setState(768);
				_errHandler.sync(this);
				_la = _input.LA(1);
				if (_la==LBRACKET) {
					{
					setState(767);
					designator();
					}
				}

				}
				break;
			case READONLY:
			case MUTABLE:
				enterOuterAlt(_localctx, 4);
				{
				setState(770);
				arrayReferenceType();
				setState(771);
				match(Identifier);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ArgumentDefinitionListContext extends ParserRuleContext {
		public List<ArgumentDefinitionContext> argumentDefinition() {
			return getRuleContexts(ArgumentDefinitionContext.class);
		}
		public ArgumentDefinitionContext argumentDefinition(int i) {
			return getRuleContext(ArgumentDefinitionContext.class,i);
		}
		public List<TerminalNode> COMMA() { return getTokens(OpenQASM3Parser.COMMA); }
		public TerminalNode COMMA(int i) {
			return getToken(OpenQASM3Parser.COMMA, i);
		}
		public ArgumentDefinitionListContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_argumentDefinitionList; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterArgumentDefinitionList(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitArgumentDefinitionList(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitArgumentDefinitionList(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ArgumentDefinitionListContext argumentDefinitionList() throws RecognitionException {
		ArgumentDefinitionListContext _localctx = new ArgumentDefinitionListContext(_ctx, getState());
		enterRule(_localctx, 122, RULE_argumentDefinitionList);
		int _la;
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			setState(775);
			argumentDefinition();
			setState(780);
			_errHandler.sync(this);
			_alt = getInterpreter().adaptivePredict(_input,87,_ctx);
			while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
				if ( _alt==1 ) {
					{
					{
					setState(776);
					match(COMMA);
					setState(777);
					argumentDefinition();
					}
					} 
				}
				setState(782);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,87,_ctx);
			}
			setState(784);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==COMMA) {
				{
				setState(783);
				match(COMMA);
				}
			}

			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class DefcalArgumentDefinitionListContext extends ParserRuleContext {
		public List<DefcalArgumentDefinitionContext> defcalArgumentDefinition() {
			return getRuleContexts(DefcalArgumentDefinitionContext.class);
		}
		public DefcalArgumentDefinitionContext defcalArgumentDefinition(int i) {
			return getRuleContext(DefcalArgumentDefinitionContext.class,i);
		}
		public List<TerminalNode> COMMA() { return getTokens(OpenQASM3Parser.COMMA); }
		public TerminalNode COMMA(int i) {
			return getToken(OpenQASM3Parser.COMMA, i);
		}
		public DefcalArgumentDefinitionListContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_defcalArgumentDefinitionList; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterDefcalArgumentDefinitionList(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitDefcalArgumentDefinitionList(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitDefcalArgumentDefinitionList(this);
			else return visitor.visitChildren(this);
		}
	}

	public final DefcalArgumentDefinitionListContext defcalArgumentDefinitionList() throws RecognitionException {
		DefcalArgumentDefinitionListContext _localctx = new DefcalArgumentDefinitionListContext(_ctx, getState());
		enterRule(_localctx, 124, RULE_defcalArgumentDefinitionList);
		int _la;
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			setState(786);
			defcalArgumentDefinition();
			setState(791);
			_errHandler.sync(this);
			_alt = getInterpreter().adaptivePredict(_input,89,_ctx);
			while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
				if ( _alt==1 ) {
					{
					{
					setState(787);
					match(COMMA);
					setState(788);
					defcalArgumentDefinition();
					}
					} 
				}
				setState(793);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,89,_ctx);
			}
			setState(795);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==COMMA) {
				{
				setState(794);
				match(COMMA);
				}
			}

			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class DefcalOperandListContext extends ParserRuleContext {
		public List<DefcalOperandContext> defcalOperand() {
			return getRuleContexts(DefcalOperandContext.class);
		}
		public DefcalOperandContext defcalOperand(int i) {
			return getRuleContext(DefcalOperandContext.class,i);
		}
		public List<TerminalNode> COMMA() { return getTokens(OpenQASM3Parser.COMMA); }
		public TerminalNode COMMA(int i) {
			return getToken(OpenQASM3Parser.COMMA, i);
		}
		public DefcalOperandListContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_defcalOperandList; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterDefcalOperandList(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitDefcalOperandList(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitDefcalOperandList(this);
			else return visitor.visitChildren(this);
		}
	}

	public final DefcalOperandListContext defcalOperandList() throws RecognitionException {
		DefcalOperandListContext _localctx = new DefcalOperandListContext(_ctx, getState());
		enterRule(_localctx, 126, RULE_defcalOperandList);
		int _la;
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			setState(797);
			defcalOperand();
			setState(802);
			_errHandler.sync(this);
			_alt = getInterpreter().adaptivePredict(_input,91,_ctx);
			while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
				if ( _alt==1 ) {
					{
					{
					setState(798);
					match(COMMA);
					setState(799);
					defcalOperand();
					}
					} 
				}
				setState(804);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,91,_ctx);
			}
			setState(806);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==COMMA) {
				{
				setState(805);
				match(COMMA);
				}
			}

			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ExpressionListContext extends ParserRuleContext {
		public List<ExpressionContext> expression() {
			return getRuleContexts(ExpressionContext.class);
		}
		public ExpressionContext expression(int i) {
			return getRuleContext(ExpressionContext.class,i);
		}
		public List<TerminalNode> COMMA() { return getTokens(OpenQASM3Parser.COMMA); }
		public TerminalNode COMMA(int i) {
			return getToken(OpenQASM3Parser.COMMA, i);
		}
		public ExpressionListContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_expressionList; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterExpressionList(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitExpressionList(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitExpressionList(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ExpressionListContext expressionList() throws RecognitionException {
		ExpressionListContext _localctx = new ExpressionListContext(_ctx, getState());
		enterRule(_localctx, 128, RULE_expressionList);
		int _la;
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			setState(808);
			expression(0);
			setState(813);
			_errHandler.sync(this);
			_alt = getInterpreter().adaptivePredict(_input,93,_ctx);
			while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
				if ( _alt==1 ) {
					{
					{
					setState(809);
					match(COMMA);
					setState(810);
					expression(0);
					}
					} 
				}
				setState(815);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,93,_ctx);
			}
			setState(817);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==COMMA) {
				{
				setState(816);
				match(COMMA);
				}
			}

			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class IdentifierListContext extends ParserRuleContext {
		public List<TerminalNode> Identifier() { return getTokens(OpenQASM3Parser.Identifier); }
		public TerminalNode Identifier(int i) {
			return getToken(OpenQASM3Parser.Identifier, i);
		}
		public List<TerminalNode> COMMA() { return getTokens(OpenQASM3Parser.COMMA); }
		public TerminalNode COMMA(int i) {
			return getToken(OpenQASM3Parser.COMMA, i);
		}
		public IdentifierListContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_identifierList; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterIdentifierList(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitIdentifierList(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitIdentifierList(this);
			else return visitor.visitChildren(this);
		}
	}

	public final IdentifierListContext identifierList() throws RecognitionException {
		IdentifierListContext _localctx = new IdentifierListContext(_ctx, getState());
		enterRule(_localctx, 130, RULE_identifierList);
		int _la;
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			setState(819);
			match(Identifier);
			setState(824);
			_errHandler.sync(this);
			_alt = getInterpreter().adaptivePredict(_input,95,_ctx);
			while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
				if ( _alt==1 ) {
					{
					{
					setState(820);
					match(COMMA);
					setState(821);
					match(Identifier);
					}
					} 
				}
				setState(826);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,95,_ctx);
			}
			setState(828);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==COMMA) {
				{
				setState(827);
				match(COMMA);
				}
			}

			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class GateOperandListContext extends ParserRuleContext {
		public List<GateOperandContext> gateOperand() {
			return getRuleContexts(GateOperandContext.class);
		}
		public GateOperandContext gateOperand(int i) {
			return getRuleContext(GateOperandContext.class,i);
		}
		public List<TerminalNode> COMMA() { return getTokens(OpenQASM3Parser.COMMA); }
		public TerminalNode COMMA(int i) {
			return getToken(OpenQASM3Parser.COMMA, i);
		}
		public GateOperandListContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_gateOperandList; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterGateOperandList(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitGateOperandList(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitGateOperandList(this);
			else return visitor.visitChildren(this);
		}
	}

	public final GateOperandListContext gateOperandList() throws RecognitionException {
		GateOperandListContext _localctx = new GateOperandListContext(_ctx, getState());
		enterRule(_localctx, 132, RULE_gateOperandList);
		int _la;
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			setState(830);
			gateOperand();
			setState(835);
			_errHandler.sync(this);
			_alt = getInterpreter().adaptivePredict(_input,97,_ctx);
			while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
				if ( _alt==1 ) {
					{
					{
					setState(831);
					match(COMMA);
					setState(832);
					gateOperand();
					}
					} 
				}
				setState(837);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,97,_ctx);
			}
			setState(839);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==COMMA) {
				{
				setState(838);
				match(COMMA);
				}
			}

			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ExternArgumentListContext extends ParserRuleContext {
		public List<ExternArgumentContext> externArgument() {
			return getRuleContexts(ExternArgumentContext.class);
		}
		public ExternArgumentContext externArgument(int i) {
			return getRuleContext(ExternArgumentContext.class,i);
		}
		public List<TerminalNode> COMMA() { return getTokens(OpenQASM3Parser.COMMA); }
		public TerminalNode COMMA(int i) {
			return getToken(OpenQASM3Parser.COMMA, i);
		}
		public ExternArgumentListContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_externArgumentList; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).enterExternArgumentList(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof OpenQASM3ParserListener ) ((OpenQASM3ParserListener)listener).exitExternArgumentList(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof OpenQASM3ParserVisitor ) return ((OpenQASM3ParserVisitor<? extends T>)visitor).visitExternArgumentList(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ExternArgumentListContext externArgumentList() throws RecognitionException {
		ExternArgumentListContext _localctx = new ExternArgumentListContext(_ctx, getState());
		enterRule(_localctx, 134, RULE_externArgumentList);
		int _la;
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			setState(841);
			externArgument();
			setState(846);
			_errHandler.sync(this);
			_alt = getInterpreter().adaptivePredict(_input,99,_ctx);
			while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
				if ( _alt==1 ) {
					{
					{
					setState(842);
					match(COMMA);
					setState(843);
					externArgument();
					}
					} 
				}
				setState(848);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,99,_ctx);
			}
			setState(850);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==COMMA) {
				{
				setState(849);
				match(COMMA);
				}
			}

			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public boolean sempred(RuleContext _localctx, int ruleIndex, int predIndex) {
		switch (ruleIndex) {
		case 38:
			return expression_sempred((ExpressionContext)_localctx, predIndex);
		}
		return true;
	}
	private boolean expression_sempred(ExpressionContext _localctx, int predIndex) {
		switch (predIndex) {
		case 0:
			return precpred(_ctx, 16);
		case 1:
			return precpred(_ctx, 14);
		case 2:
			return precpred(_ctx, 13);
		case 3:
			return precpred(_ctx, 12);
		case 4:
			return precpred(_ctx, 11);
		case 5:
			return precpred(_ctx, 10);
		case 6:
			return precpred(_ctx, 9);
		case 7:
			return precpred(_ctx, 8);
		case 8:
			return precpred(_ctx, 7);
		case 9:
			return precpred(_ctx, 6);
		case 10:
			return precpred(_ctx, 5);
		case 11:
			return precpred(_ctx, 17);
		}
		return true;
	}

	public static final String _serializedATN =
		"\u0004\u0001r\u0355\u0002\u0000\u0007\u0000\u0002\u0001\u0007\u0001\u0002"+
		"\u0002\u0007\u0002\u0002\u0003\u0007\u0003\u0002\u0004\u0007\u0004\u0002"+
		"\u0005\u0007\u0005\u0002\u0006\u0007\u0006\u0002\u0007\u0007\u0007\u0002"+
		"\b\u0007\b\u0002\t\u0007\t\u0002\n\u0007\n\u0002\u000b\u0007\u000b\u0002"+
		"\f\u0007\f\u0002\r\u0007\r\u0002\u000e\u0007\u000e\u0002\u000f\u0007\u000f"+
		"\u0002\u0010\u0007\u0010\u0002\u0011\u0007\u0011\u0002\u0012\u0007\u0012"+
		"\u0002\u0013\u0007\u0013\u0002\u0014\u0007\u0014\u0002\u0015\u0007\u0015"+
		"\u0002\u0016\u0007\u0016\u0002\u0017\u0007\u0017\u0002\u0018\u0007\u0018"+
		"\u0002\u0019\u0007\u0019\u0002\u001a\u0007\u001a\u0002\u001b\u0007\u001b"+
		"\u0002\u001c\u0007\u001c\u0002\u001d\u0007\u001d\u0002\u001e\u0007\u001e"+
		"\u0002\u001f\u0007\u001f\u0002 \u0007 \u0002!\u0007!\u0002\"\u0007\"\u0002"+
		"#\u0007#\u0002$\u0007$\u0002%\u0007%\u0002&\u0007&\u0002\'\u0007\'\u0002"+
		"(\u0007(\u0002)\u0007)\u0002*\u0007*\u0002+\u0007+\u0002,\u0007,\u0002"+
		"-\u0007-\u0002.\u0007.\u0002/\u0007/\u00020\u00070\u00021\u00071\u0002"+
		"2\u00072\u00023\u00073\u00024\u00074\u00025\u00075\u00026\u00076\u0002"+
		"7\u00077\u00028\u00078\u00029\u00079\u0002:\u0007:\u0002;\u0007;\u0002"+
		"<\u0007<\u0002=\u0007=\u0002>\u0007>\u0002?\u0007?\u0002@\u0007@\u0002"+
		"A\u0007A\u0002B\u0007B\u0002C\u0007C\u0001\u0000\u0003\u0000\u008a\b\u0000"+
		"\u0001\u0000\u0005\u0000\u008d\b\u0000\n\u0000\f\u0000\u0090\t\u0000\u0001"+
		"\u0000\u0001\u0000\u0001\u0001\u0001\u0001\u0001\u0001\u0001\u0001\u0001"+
		"\u0002\u0001\u0002\u0005\u0002\u009a\b\u0002\n\u0002\f\u0002\u009d\t\u0002"+
		"\u0001\u0002\u0001\u0002\u0001\u0002\u0001\u0002\u0001\u0002\u0001\u0002"+
		"\u0001\u0002\u0001\u0002\u0001\u0002\u0001\u0002\u0001\u0002\u0001\u0002"+
		"\u0001\u0002\u0001\u0002\u0001\u0002\u0001\u0002\u0001\u0002\u0001\u0002"+
		"\u0001\u0002\u0001\u0002\u0001\u0002\u0001\u0002\u0001\u0002\u0001\u0002"+
		"\u0001\u0002\u0001\u0002\u0001\u0002\u0001\u0002\u0001\u0002\u0001\u0002"+
		"\u0003\u0002\u00bd\b\u0002\u0003\u0002\u00bf\b\u0002\u0001\u0003\u0001"+
		"\u0003\u0003\u0003\u00c3\b\u0003\u0001\u0004\u0001\u0004\u0005\u0004\u00c7"+
		"\b\u0004\n\u0004\f\u0004\u00ca\t\u0004\u0001\u0004\u0001\u0004\u0001\u0005"+
		"\u0001\u0005\u0001\u0005\u0001\u0006\u0001\u0006\u0003\u0006\u00d3\b\u0006"+
		"\u0001\u0007\u0001\u0007\u0001\u0007\u0001\u0007\u0001\b\u0001\b\u0001"+
		"\b\u0001\b\u0001\t\u0001\t\u0001\t\u0001\n\u0001\n\u0001\n\u0001\u000b"+
		"\u0001\u000b\u0001\u000b\u0001\f\u0001\f\u0001\f\u0001\f\u0001\f\u0001"+
		"\f\u0001\f\u0001\f\u0001\f\u0001\f\u0003\f\u00f0\b\f\u0001\f\u0001\f\u0001"+
		"\r\u0001\r\u0001\r\u0001\r\u0001\r\u0001\r\u0001\r\u0003\r\u00fb\b\r\u0001"+
		"\u000e\u0001\u000e\u0001\u000e\u0001\u000e\u0003\u000e\u0101\b\u000e\u0001"+
		"\u000e\u0001\u000e\u0001\u000f\u0001\u000f\u0001\u000f\u0001\u000f\u0001"+
		"\u000f\u0001\u000f\u0001\u0010\u0001\u0010\u0001\u0010\u0001\u0010\u0001"+
		"\u0010\u0001\u0010\u0005\u0010\u0111\b\u0010\n\u0010\f\u0010\u0114\t\u0010"+
		"\u0001\u0010\u0001\u0010\u0001\u0011\u0001\u0011\u0001\u0011\u0001\u0011"+
		"\u0001\u0011\u0001\u0011\u0003\u0011\u011e\b\u0011\u0001\u0012\u0001\u0012"+
		"\u0003\u0012\u0122\b\u0012\u0001\u0012\u0001\u0012\u0001\u0013\u0001\u0013"+
		"\u0003\u0013\u0128\b\u0013\u0001\u0013\u0001\u0013\u0001\u0014\u0001\u0014"+
		"\u0001\u0014\u0003\u0014\u012f\b\u0014\u0001\u0014\u0001\u0014\u0001\u0015"+
		"\u0001\u0015\u0003\u0015\u0135\b\u0015\u0001\u0015\u0001\u0015\u0001\u0016"+
		"\u0005\u0016\u013a\b\u0016\n\u0016\f\u0016\u013d\t\u0016\u0001\u0016\u0001"+
		"\u0016\u0001\u0016\u0003\u0016\u0142\b\u0016\u0001\u0016\u0003\u0016\u0145"+
		"\b\u0016\u0001\u0016\u0003\u0016\u0148\b\u0016\u0001\u0016\u0001\u0016"+
		"\u0001\u0016\u0001\u0016\u0005\u0016\u014e\b\u0016\n\u0016\f\u0016\u0151"+
		"\t\u0016\u0001\u0016\u0001\u0016\u0001\u0016\u0003\u0016\u0156\b\u0016"+
		"\u0001\u0016\u0003\u0016\u0159\b\u0016\u0001\u0016\u0003\u0016\u015c\b"+
		"\u0016\u0001\u0016\u0003\u0016\u015f\b\u0016\u0001\u0016\u0003\u0016\u0162"+
		"\b\u0016\u0001\u0017\u0001\u0017\u0003\u0017\u0166\b\u0017\u0001\u0017"+
		"\u0001\u0017\u0003\u0017\u016a\b\u0017\u0001\u0017\u0001\u0017\u0001\u0018"+
		"\u0001\u0018\u0001\u0018\u0001\u0018\u0001\u0019\u0001\u0019\u0001\u0019"+
		"\u0001\u0019\u0001\u0019\u0001\u0019\u0001\u001a\u0001\u001a\u0003\u001a"+
		"\u017a\b\u001a\u0001\u001a\u0001\u001a\u0001\u001a\u0003\u001a\u017f\b"+
		"\u001a\u0001\u001a\u0001\u001a\u0001\u001b\u0001\u001b\u0001\u001b\u0001"+
		"\u001b\u0001\u001b\u0001\u001b\u0001\u001b\u0001\u001c\u0001\u001c\u0001"+
		"\u001c\u0003\u001c\u018d\b\u001c\u0001\u001c\u0001\u001c\u0001\u001c\u0001"+
		"\u001d\u0001\u001d\u0001\u001d\u0003\u001d\u0195\b\u001d\u0001\u001d\u0001"+
		"\u001d\u0001\u001e\u0001\u001e\u0001\u001e\u0001\u001e\u0001\u001f\u0001"+
		"\u001f\u0001\u001f\u0001\u001f\u0003\u001f\u01a1\b\u001f\u0001\u001f\u0001"+
		"\u001f\u0003\u001f\u01a5\b\u001f\u0001\u001f\u0001\u001f\u0001 \u0001"+
		" \u0001 \u0001 \u0003 \u01ad\b \u0001 \u0001 \u0003 \u01b1\b \u0001 \u0001"+
		" \u0001!\u0001!\u0001!\u0001!\u0003!\u01b9\b!\u0001!\u0003!\u01bc\b!\u0001"+
		"!\u0001!\u0001!\u0001\"\u0001\"\u0001\"\u0001\"\u0001\"\u0003\"\u01c6"+
		"\b\"\u0001\"\u0001\"\u0001#\u0001#\u0001#\u0001$\u0001$\u0001$\u0003$"+
		"\u01d0\b$\u0001$\u0001$\u0001%\u0001%\u0001%\u0001%\u0003%\u01d8\b%\u0001"+
		"%\u0003%\u01db\b%\u0001%\u0001%\u0003%\u01df\b%\u0001%\u0001%\u0003%\u01e3"+
		"\b%\u0001%\u0001%\u0001&\u0001&\u0001&\u0001&\u0001&\u0001&\u0001&\u0001"+
		"&\u0001&\u0003&\u01f0\b&\u0001&\u0001&\u0001&\u0001&\u0001&\u0001&\u0001"+
		"&\u0001&\u0001&\u0001&\u0001&\u0001&\u0003&\u01fe\b&\u0001&\u0001&\u0003"+
		"&\u0202\b&\u0001&\u0001&\u0001&\u0001&\u0001&\u0001&\u0001&\u0001&\u0001"+
		"&\u0001&\u0001&\u0001&\u0001&\u0001&\u0001&\u0001&\u0001&\u0001&\u0001"+
		"&\u0001&\u0001&\u0001&\u0001&\u0001&\u0001&\u0001&\u0001&\u0001&\u0001"+
		"&\u0001&\u0001&\u0001&\u0001&\u0001&\u0001&\u0005&\u0227\b&\n&\f&\u022a"+
		"\t&\u0001\'\u0001\'\u0001\'\u0005\'\u022f\b\'\n\'\f\'\u0232\t\'\u0001"+
		"(\u0001(\u0001(\u0001(\u0003(\u0238\b(\u0001)\u0001)\u0001)\u0001*\u0001"+
		"*\u0001*\u0003*\u0240\b*\u0001*\u0003*\u0243\b*\u0001*\u0001*\u0001+\u0003"+
		"+\u0248\b+\u0001+\u0001+\u0003+\u024c\b+\u0001+\u0001+\u0003+\u0250\b"+
		"+\u0001,\u0001,\u0001,\u0001,\u0005,\u0256\b,\n,\f,\u0259\t,\u0001,\u0003"+
		",\u025c\b,\u0001,\u0001,\u0001-\u0001-\u0001-\u0003-\u0263\b-\u0001-\u0001"+
		"-\u0001-\u0003-\u0268\b-\u0005-\u026a\b-\n-\f-\u026d\t-\u0001-\u0003-"+
		"\u0270\b-\u0003-\u0272\b-\u0001-\u0001-\u0001.\u0001.\u0001.\u0001.\u0003"+
		".\u027a\b.\u0001.\u0001.\u0001.\u0003.\u027f\b.\u0005.\u0281\b.\n.\f."+
		"\u0284\t.\u0001.\u0003.\u0287\b.\u0003.\u0289\b.\u0001.\u0001.\u0001/"+
		"\u0001/\u0005/\u028f\b/\n/\f/\u0292\t/\u00010\u00010\u00010\u00011\u0001"+
		"1\u00011\u00011\u00011\u00011\u00011\u00011\u00011\u00011\u00011\u0003"+
		"1\u02a2\b1\u00031\u02a4\b1\u00011\u00011\u00012\u00012\u00032\u02aa\b"+
		"2\u00012\u00012\u00032\u02ae\b2\u00012\u00012\u00032\u02b2\b2\u00012\u0001"+
		"2\u00032\u02b6\b2\u00012\u00012\u00032\u02ba\b2\u00012\u00012\u00012\u0001"+
		"2\u00012\u00012\u00012\u00012\u00032\u02c4\b2\u00032\u02c6\b2\u00013\u0001"+
		"3\u00033\u02ca\b3\u00014\u00014\u00014\u00014\u00014\u00014\u00014\u0001"+
		"5\u00015\u00015\u00015\u00015\u00015\u00015\u00015\u00015\u00035\u02dc"+
		"\b5\u00015\u00015\u00016\u00016\u00016\u00016\u00017\u00017\u00018\u0001"+
		"8\u00038\u02e8\b8\u00019\u00019\u0001:\u0001:\u0003:\u02ee\b:\u0001;\u0001"+
		";\u0001;\u0001;\u0003;\u02f4\b;\u0003;\u02f6\b;\u0001<\u0001<\u0001<\u0001"+
		"<\u0001<\u0001<\u0001<\u0001<\u0001<\u0003<\u0301\b<\u0001<\u0001<\u0001"+
		"<\u0003<\u0306\b<\u0001=\u0001=\u0001=\u0005=\u030b\b=\n=\f=\u030e\t="+
		"\u0001=\u0003=\u0311\b=\u0001>\u0001>\u0001>\u0005>\u0316\b>\n>\f>\u0319"+
		"\t>\u0001>\u0003>\u031c\b>\u0001?\u0001?\u0001?\u0005?\u0321\b?\n?\f?"+
		"\u0324\t?\u0001?\u0003?\u0327\b?\u0001@\u0001@\u0001@\u0005@\u032c\b@"+
		"\n@\f@\u032f\t@\u0001@\u0003@\u0332\b@\u0001A\u0001A\u0001A\u0005A\u0337"+
		"\bA\nA\fA\u033a\tA\u0001A\u0003A\u033d\bA\u0001B\u0001B\u0001B\u0005B"+
		"\u0342\bB\nB\fB\u0345\tB\u0001B\u0003B\u0348\bB\u0001C\u0001C\u0001C\u0005"+
		"C\u034d\bC\nC\fC\u0350\tC\u0001C\u0003C\u0353\bC\u0001C\u0000\u0001LD"+
		"\u0000\u0002\u0004\u0006\b\n\f\u000e\u0010\u0012\u0014\u0016\u0018\u001a"+
		"\u001c\u001e \"$&(*,.02468:<>@BDFHJLNPRTVXZ\\^`bdfhjlnprtvxz|~\u0080\u0082"+
		"\u0084\u0086\u0000\u000b\u0001\u0000\u001a\u001b\u0002\u0000\u001f\u001f"+
		"!!\u0002\u0000CCUU\u0002\u0000GGRS\u0002\u000088Yb\u0002\u0000HHJK\u0002"+
		"\u0000EEGG\u0001\u000001\u0001\u0000\u001d\u001e\u0002\u000046^^\u0001"+
		"\u0000^_\u03b0\u0000\u0089\u0001\u0000\u0000\u0000\u0002\u0093\u0001\u0000"+
		"\u0000\u0000\u0004\u00be\u0001\u0000\u0000\u0000\u0006\u00c0\u0001\u0000"+
		"\u0000\u0000\b\u00c4\u0001\u0000\u0000\u0000\n\u00cd\u0001\u0000\u0000"+
		"\u0000\f\u00d2\u0001\u0000\u0000\u0000\u000e\u00d4\u0001\u0000\u0000\u0000"+
		"\u0010\u00d8\u0001\u0000\u0000\u0000\u0012\u00dc\u0001\u0000\u0000\u0000"+
		"\u0014\u00df\u0001\u0000\u0000\u0000\u0016\u00e2\u0001\u0000\u0000\u0000"+
		"\u0018\u00e5\u0001\u0000\u0000\u0000\u001a\u00f3\u0001\u0000\u0000\u0000"+
		"\u001c\u00fc\u0001\u0000\u0000\u0000\u001e\u0104\u0001\u0000\u0000\u0000"+
		" \u010a\u0001\u0000\u0000\u0000\"\u011d\u0001\u0000\u0000\u0000$\u011f"+
		"\u0001\u0000\u0000\u0000&\u0125\u0001\u0000\u0000\u0000(\u012b\u0001\u0000"+
		"\u0000\u0000*\u0132\u0001\u0000\u0000\u0000,\u0161\u0001\u0000\u0000\u0000"+
		".\u0165\u0001\u0000\u0000\u00000\u016d\u0001\u0000\u0000\u00002\u0171"+
		"\u0001\u0000\u0000\u00004\u0179\u0001\u0000\u0000\u00006\u0182\u0001\u0000"+
		"\u0000\u00008\u0189\u0001\u0000\u0000\u0000:\u0191\u0001\u0000\u0000\u0000"+
		"<\u0198\u0001\u0000\u0000\u0000>\u019c\u0001\u0000\u0000\u0000@\u01a8"+
		"\u0001\u0000\u0000\u0000B\u01b4\u0001\u0000\u0000\u0000D\u01c0\u0001\u0000"+
		"\u0000\u0000F\u01c9\u0001\u0000\u0000\u0000H\u01cc\u0001\u0000\u0000\u0000"+
		"J\u01d3\u0001\u0000\u0000\u0000L\u0201\u0001\u0000\u0000\u0000N\u022b"+
		"\u0001\u0000\u0000\u0000P\u0237\u0001\u0000\u0000\u0000R\u0239\u0001\u0000"+
		"\u0000\u0000T\u023c\u0001\u0000\u0000\u0000V\u0247\u0001\u0000\u0000\u0000"+
		"X\u0251\u0001\u0000\u0000\u0000Z\u025f\u0001\u0000\u0000\u0000\\\u0275"+
		"\u0001\u0000\u0000\u0000^\u028c\u0001\u0000\u0000\u0000`\u0293\u0001\u0000"+
		"\u0000\u0000b\u02a3\u0001\u0000\u0000\u0000d\u02c5\u0001\u0000\u0000\u0000"+
		"f\u02c7\u0001\u0000\u0000\u0000h\u02cb\u0001\u0000\u0000\u0000j\u02d2"+
		"\u0001\u0000\u0000\u0000l\u02df\u0001\u0000\u0000\u0000n\u02e3\u0001\u0000"+
		"\u0000\u0000p\u02e7\u0001\u0000\u0000\u0000r\u02e9\u0001\u0000\u0000\u0000"+
		"t\u02ed\u0001\u0000\u0000\u0000v\u02f5\u0001\u0000\u0000\u0000x\u0305"+
		"\u0001\u0000\u0000\u0000z\u0307\u0001\u0000\u0000\u0000|\u0312\u0001\u0000"+
		"\u0000\u0000~\u031d\u0001\u0000\u0000\u0000\u0080\u0328\u0001\u0000\u0000"+
		"\u0000\u0082\u0333\u0001\u0000\u0000\u0000\u0084\u033e\u0001\u0000\u0000"+
		"\u0000\u0086\u0349\u0001\u0000\u0000\u0000\u0088\u008a\u0003\u0002\u0001"+
		"\u0000\u0089\u0088\u0001\u0000\u0000\u0000\u0089\u008a\u0001\u0000\u0000"+
		"\u0000\u008a\u008e\u0001\u0000\u0000\u0000\u008b\u008d\u0003\f\u0006\u0000"+
		"\u008c\u008b\u0001\u0000\u0000\u0000\u008d\u0090\u0001\u0000\u0000\u0000"+
		"\u008e\u008c\u0001\u0000\u0000\u0000\u008e\u008f\u0001\u0000\u0000\u0000"+
		"\u008f\u0091\u0001\u0000\u0000\u0000\u0090\u008e\u0001\u0000\u0000\u0000"+
		"\u0091\u0092\u0005\u0000\u0000\u0001\u0092\u0001\u0001\u0000\u0000\u0000"+
		"\u0093\u0094\u0005\u0001\u0000\u0000\u0094\u0095\u0005h\u0000\u0000\u0095"+
		"\u0096\u0005@\u0000\u0000\u0096\u0003\u0001\u0000\u0000\u0000\u0097\u00bf"+
		"\u0003\n\u0005\u0000\u0098\u009a\u0003\u0006\u0003\u0000\u0099\u0098\u0001"+
		"\u0000\u0000\u0000\u009a\u009d\u0001\u0000\u0000\u0000\u009b\u0099\u0001"+
		"\u0000\u0000\u0000\u009b\u009c\u0001\u0000\u0000\u0000\u009c\u00bc\u0001"+
		"\u0000\u0000\u0000\u009d\u009b\u0001\u0000\u0000\u0000\u009e\u00bd\u0003"+
		"2\u0019\u0000\u009f\u00bd\u0003D\"\u0000\u00a0\u00bd\u0003$\u0012\u0000"+
		"\u00a1\u00bd\u0003&\u0013\u0000\u00a2\u00bd\u0003\u0012\t\u0000\u00a3"+
		"\u00bd\u0003H$\u0000\u00a4\u00bd\u0003\u000e\u0007\u0000\u00a5\u00bd\u0003"+
		"4\u001a\u0000\u00a6\u00bd\u00036\u001b\u0000\u00a7\u00bd\u0003\u0014\n"+
		"\u0000\u00a8\u00bd\u0003>\u001f\u0000\u00a9\u00bd\u0003J%\u0000\u00aa"+
		"\u00bd\u0003(\u0014\u0000\u00ab\u00bd\u0003\u0016\u000b\u0000\u00ac\u00bd"+
		"\u0003F#\u0000\u00ad\u00bd\u0003@ \u0000\u00ae\u00bd\u0003\u0018\f\u0000"+
		"\u00af\u00bd\u0003,\u0016\u0000\u00b0\u00bd\u0003B!\u0000\u00b1\u00bd"+
		"\u0003\u001a\r\u0000\u00b2\u00bd\u0003\u0010\b\u0000\u00b3\u00bd\u0003"+
		"8\u001c\u0000\u00b4\u00bd\u0003.\u0017\u0000\u00b5\u00bd\u0003*\u0015"+
		"\u0000\u00b6\u00bd\u0003:\u001d\u0000\u00b7\u00bd\u0003<\u001e\u0000\u00b8"+
		"\u00bd\u00030\u0018\u0000\u00b9\u00bd\u0003\u001c\u000e\u0000\u00ba\u00bd"+
		"\u0003 \u0010\u0000\u00bb\u00bd\u0003\u001e\u000f\u0000\u00bc\u009e\u0001"+
		"\u0000\u0000\u0000\u00bc\u009f\u0001\u0000\u0000\u0000\u00bc\u00a0\u0001"+
		"\u0000\u0000\u0000\u00bc\u00a1\u0001\u0000\u0000\u0000\u00bc\u00a2\u0001"+
		"\u0000\u0000\u0000\u00bc\u00a3\u0001\u0000\u0000\u0000\u00bc\u00a4\u0001"+
		"\u0000\u0000\u0000\u00bc\u00a5\u0001\u0000\u0000\u0000\u00bc\u00a6\u0001"+
		"\u0000\u0000\u0000\u00bc\u00a7\u0001\u0000\u0000\u0000\u00bc\u00a8\u0001"+
		"\u0000\u0000\u0000\u00bc\u00a9\u0001\u0000\u0000\u0000\u00bc\u00aa\u0001"+
		"\u0000\u0000\u0000\u00bc\u00ab\u0001\u0000\u0000\u0000\u00bc\u00ac\u0001"+
		"\u0000\u0000\u0000\u00bc\u00ad\u0001\u0000\u0000\u0000\u00bc\u00ae\u0001"+
		"\u0000\u0000\u0000\u00bc\u00af\u0001\u0000\u0000\u0000\u00bc\u00b0\u0001"+
		"\u0000\u0000\u0000\u00bc\u00b1\u0001\u0000\u0000\u0000\u00bc\u00b2\u0001"+
		"\u0000\u0000\u0000\u00bc\u00b3\u0001\u0000\u0000\u0000\u00bc\u00b4\u0001"+
		"\u0000\u0000\u0000\u00bc\u00b5\u0001\u0000\u0000\u0000\u00bc\u00b6\u0001"+
		"\u0000\u0000\u0000\u00bc\u00b7\u0001\u0000\u0000\u0000\u00bc\u00b8\u0001"+
		"\u0000\u0000\u0000\u00bc\u00b9\u0001\u0000\u0000\u0000\u00bc\u00ba\u0001"+
		"\u0000\u0000\u0000\u00bc\u00bb\u0001\u0000\u0000\u0000\u00bd\u00bf\u0001"+
		"\u0000\u0000\u0000\u00be\u0097\u0001\u0000\u0000\u0000\u00be\u009b\u0001"+
		"\u0000\u0000\u0000\u00bf\u0005\u0001\u0000\u0000\u0000\u00c0\u00c2\u0005"+
		"\u0019\u0000\u0000\u00c1\u00c3\u0005m\u0000\u0000\u00c2\u00c1\u0001\u0000"+
		"\u0000\u0000\u00c2\u00c3\u0001\u0000\u0000\u0000\u00c3\u0007\u0001\u0000"+
		"\u0000\u0000\u00c4\u00c8\u0005;\u0000\u0000\u00c5\u00c7\u0003\f\u0006"+
		"\u0000\u00c6\u00c5\u0001\u0000\u0000\u0000\u00c7\u00ca\u0001\u0000\u0000"+
		"\u0000\u00c8\u00c6\u0001\u0000\u0000\u0000\u00c8\u00c9\u0001\u0000\u0000"+
		"\u0000\u00c9\u00cb\u0001\u0000\u0000\u0000\u00ca\u00c8\u0001\u0000\u0000"+
		"\u0000\u00cb\u00cc\u0005<\u0000\u0000\u00cc\t\u0001\u0000\u0000\u0000"+
		"\u00cd\u00ce\u0005\u0018\u0000\u0000\u00ce\u00cf\u0005m\u0000\u0000\u00cf"+
		"\u000b\u0001\u0000\u0000\u0000\u00d0\u00d3\u0003\u0004\u0002\u0000\u00d1"+
		"\u00d3\u0003\b\u0004\u0000\u00d2\u00d0\u0001\u0000\u0000\u0000\u00d2\u00d1"+
		"\u0001\u0000\u0000\u0000\u00d3\r\u0001\u0000\u0000\u0000\u00d4\u00d5\u0005"+
		"\u0003\u0000\u0000\u00d5\u00d6\u0005j\u0000\u0000\u00d6\u00d7\u0005@\u0000"+
		"\u0000\u00d7\u000f\u0001\u0000\u0000\u0000\u00d8\u00d9\u0005\u0002\u0000"+
		"\u0000\u00d9\u00da\u0005j\u0000\u0000\u00da\u00db\u0005@\u0000\u0000\u00db"+
		"\u0011\u0001\u0000\u0000\u0000\u00dc\u00dd\u0005\u000b\u0000\u0000\u00dd"+
		"\u00de\u0005@\u0000\u0000\u00de\u0013\u0001\u0000\u0000\u0000\u00df\u00e0"+
		"\u0005\f\u0000\u0000\u00e0\u00e1\u0005@\u0000\u0000\u00e1\u0015\u0001"+
		"\u0000\u0000\u0000\u00e2\u00e3\u0005\u000f\u0000\u0000\u00e3\u00e4\u0005"+
		"@\u0000\u0000\u00e4\u0017\u0001\u0000\u0000\u0000\u00e5\u00e6\u0005\u0011"+
		"\u0000\u0000\u00e6\u00e7\u0003d2\u0000\u00e7\u00e8\u0005^\u0000\u0000"+
		"\u00e8\u00ef\u0005\u0013\u0000\u0000\u00e9\u00f0\u0003X,\u0000\u00ea\u00eb"+
		"\u00059\u0000\u0000\u00eb\u00ec\u0003V+\u0000\u00ec\u00ed\u0005:\u0000"+
		"\u0000\u00ed\u00f0\u0001\u0000\u0000\u0000\u00ee\u00f0\u0003L&\u0000\u00ef"+
		"\u00e9\u0001\u0000\u0000\u0000\u00ef\u00ea\u0001\u0000\u0000\u0000\u00ef"+
		"\u00ee\u0001\u0000\u0000\u0000\u00f0\u00f1\u0001\u0000\u0000\u0000\u00f1"+
		"\u00f2\u0003\f\u0006\u0000\u00f2\u0019\u0001\u0000\u0000\u0000\u00f3\u00f4"+
		"\u0005\r\u0000\u0000\u00f4\u00f5\u0005=\u0000\u0000\u00f5\u00f6\u0003"+
		"L&\u0000\u00f6\u00f7\u0005>\u0000\u0000\u00f7\u00fa\u0003\f\u0006\u0000"+
		"\u00f8\u00f9\u0005\u000e\u0000\u0000\u00f9\u00fb\u0003\f\u0006\u0000\u00fa"+
		"\u00f8\u0001\u0000\u0000\u0000\u00fa\u00fb\u0001\u0000\u0000\u0000\u00fb"+
		"\u001b\u0001\u0000\u0000\u0000\u00fc\u0100\u0005\u0010\u0000\u0000\u00fd"+
		"\u0101\u0003L&\u0000\u00fe\u0101\u0003R)\u0000\u00ff\u0101\u0003T*\u0000"+
		"\u0100\u00fd\u0001\u0000\u0000\u0000\u0100\u00fe\u0001\u0000\u0000\u0000"+
		"\u0100\u00ff\u0001\u0000\u0000\u0000\u0100\u0101\u0001\u0000\u0000\u0000"+
		"\u0101\u0102\u0001\u0000\u0000\u0000\u0102\u0103\u0005@\u0000\u0000\u0103"+
		"\u001d\u0001\u0000\u0000\u0000\u0104\u0105\u0005\u0012\u0000\u0000\u0105"+
		"\u0106\u0005=\u0000\u0000\u0106\u0107\u0003L&\u0000\u0107\u0108\u0005"+
		">\u0000\u0000\u0108\u0109\u0003\f\u0006\u0000\u0109\u001f\u0001\u0000"+
		"\u0000\u0000\u010a\u010b\u0005\u0014\u0000\u0000\u010b\u010c\u0005=\u0000"+
		"\u0000\u010c\u010d\u0003L&\u0000\u010d\u010e\u0005>\u0000\u0000\u010e"+
		"\u0112\u0005;\u0000\u0000\u010f\u0111\u0003\"\u0011\u0000\u0110\u010f"+
		"\u0001\u0000\u0000\u0000\u0111\u0114\u0001\u0000\u0000\u0000\u0112\u0110"+
		"\u0001\u0000\u0000\u0000\u0112\u0113\u0001\u0000\u0000\u0000\u0113\u0115"+
		"\u0001\u0000\u0000\u0000\u0114\u0112\u0001\u0000\u0000\u0000\u0115\u0116"+
		"\u0005<\u0000\u0000\u0116!\u0001\u0000\u0000\u0000\u0117\u0118\u0005\u0015"+
		"\u0000\u0000\u0118\u0119\u0003\u0080@\u0000\u0119\u011a\u0003\b\u0004"+
		"\u0000\u011a\u011e\u0001\u0000\u0000\u0000\u011b\u011c\u0005\u0016\u0000"+
		"\u0000\u011c\u011e\u0003\b\u0004\u0000\u011d\u0117\u0001\u0000\u0000\u0000"+
		"\u011d\u011b\u0001\u0000\u0000\u0000\u011e#\u0001\u0000\u0000\u0000\u011f"+
		"\u0121\u00057\u0000\u0000\u0120\u0122\u0003\u0084B\u0000\u0121\u0120\u0001"+
		"\u0000\u0000\u0000\u0121\u0122\u0001\u0000\u0000\u0000\u0122\u0123\u0001"+
		"\u0000\u0000\u0000\u0123\u0124\u0005@\u0000\u0000\u0124%\u0001\u0000\u0000"+
		"\u0000\u0125\u0127\u0005\t\u0000\u0000\u0126\u0128\u0003l6\u0000\u0127"+
		"\u0126\u0001\u0000\u0000\u0000\u0127\u0128\u0001\u0000\u0000\u0000\u0128"+
		"\u0129\u0001\u0000\u0000\u0000\u0129\u012a\u0003\b\u0004\u0000\u012a\'"+
		"\u0001\u0000\u0000\u0000\u012b\u012c\u00054\u0000\u0000\u012c\u012e\u0003"+
		"l6\u0000\u012d\u012f\u0003\u0084B\u0000\u012e\u012d\u0001\u0000\u0000"+
		"\u0000\u012e\u012f\u0001\u0000\u0000\u0000\u012f\u0130\u0001\u0000\u0000"+
		"\u0000\u0130\u0131\u0005@\u0000\u0000\u0131)\u0001\u0000\u0000\u0000\u0132"+
		"\u0134\u0005\u0017\u0000\u0000\u0133\u0135\u0003\u0084B\u0000\u0134\u0133"+
		"\u0001\u0000\u0000\u0000\u0134\u0135\u0001\u0000\u0000\u0000\u0135\u0136"+
		"\u0001\u0000\u0000\u0000\u0136\u0137\u0005@\u0000\u0000\u0137+\u0001\u0000"+
		"\u0000\u0000\u0138\u013a\u0003b1\u0000\u0139\u0138\u0001\u0000\u0000\u0000"+
		"\u013a\u013d\u0001\u0000\u0000\u0000\u013b\u0139\u0001\u0000\u0000\u0000"+
		"\u013b\u013c\u0001\u0000\u0000\u0000\u013c\u013e\u0001\u0000\u0000\u0000"+
		"\u013d\u013b\u0001\u0000\u0000\u0000\u013e\u0144\u0005^\u0000\u0000\u013f"+
		"\u0141\u0005=\u0000\u0000\u0140\u0142\u0003\u0080@\u0000\u0141\u0140\u0001"+
		"\u0000\u0000\u0000\u0141\u0142\u0001\u0000\u0000\u0000\u0142\u0143\u0001"+
		"\u0000\u0000\u0000\u0143\u0145\u0005>\u0000\u0000\u0144\u013f\u0001\u0000"+
		"\u0000\u0000\u0144\u0145\u0001\u0000\u0000\u0000\u0145\u0147\u0001\u0000"+
		"\u0000\u0000\u0146\u0148\u0003l6\u0000\u0147\u0146\u0001\u0000\u0000\u0000"+
		"\u0147\u0148\u0001\u0000\u0000\u0000\u0148\u0149\u0001\u0000\u0000\u0000"+
		"\u0149\u014a\u0003\u0084B\u0000\u014a\u014b\u0005@\u0000\u0000\u014b\u0162"+
		"\u0001\u0000\u0000\u0000\u014c\u014e\u0003b1\u0000\u014d\u014c\u0001\u0000"+
		"\u0000\u0000\u014e\u0151\u0001\u0000\u0000\u0000\u014f\u014d\u0001\u0000"+
		"\u0000\u0000\u014f\u0150\u0001\u0000\u0000\u0000\u0150\u0152\u0001\u0000"+
		"\u0000\u0000\u0151\u014f\u0001\u0000\u0000\u0000\u0152\u0158\u0005-\u0000"+
		"\u0000\u0153\u0155\u0005=\u0000\u0000\u0154\u0156\u0003\u0080@\u0000\u0155"+
		"\u0154\u0001\u0000\u0000\u0000\u0155\u0156\u0001\u0000\u0000\u0000\u0156"+
		"\u0157\u0001\u0000\u0000\u0000\u0157\u0159\u0005>\u0000\u0000\u0158\u0153"+
		"\u0001\u0000\u0000\u0000\u0158\u0159\u0001\u0000\u0000\u0000\u0159\u015b"+
		"\u0001\u0000\u0000\u0000\u015a\u015c\u0003l6\u0000\u015b\u015a\u0001\u0000"+
		"\u0000\u0000\u015b\u015c\u0001\u0000\u0000\u0000\u015c\u015e\u0001\u0000"+
		"\u0000\u0000\u015d\u015f\u0003\u0084B\u0000\u015e\u015d\u0001\u0000\u0000"+
		"\u0000\u015e\u015f\u0001\u0000\u0000\u0000\u015f\u0160\u0001\u0000\u0000"+
		"\u0000\u0160\u0162\u0005@\u0000\u0000\u0161\u013b\u0001\u0000\u0000\u0000"+
		"\u0161\u014f\u0001\u0000\u0000\u0000\u0162-\u0001\u0000\u0000\u0000\u0163"+
		"\u0166\u0003R)\u0000\u0164\u0166\u0003T*\u0000\u0165\u0163\u0001\u0000"+
		"\u0000\u0000\u0165\u0164\u0001\u0000\u0000\u0000\u0166\u0169\u0001\u0000"+
		"\u0000\u0000\u0167\u0168\u0005D\u0000\u0000\u0168\u016a\u0003^/\u0000"+
		"\u0169\u0167\u0001\u0000\u0000\u0000\u0169\u016a\u0001\u0000\u0000\u0000"+
		"\u016a\u016b\u0001\u0000\u0000\u0000\u016b\u016c\u0005@\u0000\u0000\u016c"+
		"/\u0001\u0000\u0000\u0000\u016d\u016e\u00055\u0000\u0000\u016e\u016f\u0003"+
		"t:\u0000\u016f\u0170\u0005@\u0000\u0000\u01701\u0001\u0000\u0000\u0000"+
		"\u0171\u0172\u0005\n\u0000\u0000\u0172\u0173\u0005^\u0000\u0000\u0173"+
		"\u0174\u0005C\u0000\u0000\u0174\u0175\u0003N\'\u0000\u0175\u0176\u0005"+
		"@\u0000\u0000\u01763\u0001\u0000\u0000\u0000\u0177\u017a\u0003d2\u0000"+
		"\u0178\u017a\u0003h4\u0000\u0179\u0177\u0001\u0000\u0000\u0000\u0179\u0178"+
		"\u0001\u0000\u0000\u0000\u017a\u017b\u0001\u0000\u0000\u0000\u017b\u017e"+
		"\u0005^\u0000\u0000\u017c\u017d\u0005C\u0000\u0000\u017d\u017f\u0003P"+
		"(\u0000\u017e\u017c\u0001\u0000\u0000\u0000\u017e\u017f\u0001\u0000\u0000"+
		"\u0000\u017f\u0180\u0001\u0000\u0000\u0000\u0180\u0181\u0005@\u0000\u0000"+
		"\u01815\u0001\u0000\u0000\u0000\u0182\u0183\u0005\u001c\u0000\u0000\u0183"+
		"\u0184\u0003d2\u0000\u0184\u0185\u0005^\u0000\u0000\u0185\u0186\u0005"+
		"C\u0000\u0000\u0186\u0187\u0003P(\u0000\u0187\u0188\u0005@\u0000\u0000"+
		"\u01887\u0001\u0000\u0000\u0000\u0189\u018c\u0007\u0000\u0000\u0000\u018a"+
		"\u018d\u0003d2\u0000\u018b\u018d\u0003h4\u0000\u018c\u018a\u0001\u0000"+
		"\u0000\u0000\u018c\u018b\u0001\u0000\u0000\u0000\u018d\u018e\u0001\u0000"+
		"\u0000\u0000\u018e\u018f\u0005^\u0000\u0000\u018f\u0190\u0005@\u0000\u0000"+
		"\u01909\u0001\u0000\u0000\u0000\u0191\u0192\u0007\u0001\u0000\u0000\u0192"+
		"\u0194\u0005^\u0000\u0000\u0193\u0195\u0003l6\u0000\u0194\u0193\u0001"+
		"\u0000\u0000\u0000\u0194\u0195\u0001\u0000\u0000\u0000\u0195\u0196\u0001"+
		"\u0000\u0000\u0000\u0196\u0197\u0005@\u0000\u0000\u0197;\u0001\u0000\u0000"+
		"\u0000\u0198\u0199\u0003f3\u0000\u0199\u019a\u0005^\u0000\u0000\u019a"+
		"\u019b\u0005@\u0000\u0000\u019b=\u0001\u0000\u0000\u0000\u019c\u019d\u0005"+
		"\u0004\u0000\u0000\u019d\u019e\u0005^\u0000\u0000\u019e\u01a0\u0005=\u0000"+
		"\u0000\u019f\u01a1\u0003z=\u0000\u01a0\u019f\u0001\u0000\u0000\u0000\u01a0"+
		"\u01a1\u0001\u0000\u0000\u0000\u01a1\u01a2\u0001\u0000\u0000\u0000\u01a2"+
		"\u01a4\u0005>\u0000\u0000\u01a3\u01a5\u0003`0\u0000\u01a4\u01a3\u0001"+
		"\u0000\u0000\u0000\u01a4\u01a5\u0001\u0000\u0000\u0000\u01a5\u01a6\u0001"+
		"\u0000\u0000\u0000\u01a6\u01a7\u0003\b\u0004\u0000\u01a7?\u0001\u0000"+
		"\u0000\u0000\u01a8\u01a9\u0005\b\u0000\u0000\u01a9\u01aa\u0005^\u0000"+
		"\u0000\u01aa\u01ac\u0005=\u0000\u0000\u01ab\u01ad\u0003\u0086C\u0000\u01ac"+
		"\u01ab\u0001\u0000\u0000\u0000\u01ac\u01ad\u0001\u0000\u0000\u0000\u01ad"+
		"\u01ae\u0001\u0000\u0000\u0000\u01ae\u01b0\u0005>\u0000\u0000\u01af\u01b1"+
		"\u0003`0\u0000\u01b0\u01af\u0001\u0000\u0000\u0000\u01b0\u01b1\u0001\u0000"+
		"\u0000\u0000\u01b1\u01b2\u0001\u0000\u0000\u0000\u01b2\u01b3\u0005@\u0000"+
		"\u0000\u01b3A\u0001\u0000\u0000\u0000\u01b4\u01b5\u0005\u0007\u0000\u0000"+
		"\u01b5\u01bb\u0005^\u0000\u0000\u01b6\u01b8\u0005=\u0000\u0000\u01b7\u01b9"+
		"\u0003\u0082A\u0000\u01b8\u01b7\u0001\u0000\u0000\u0000\u01b8\u01b9\u0001"+
		"\u0000\u0000\u0000\u01b9\u01ba\u0001\u0000\u0000\u0000\u01ba\u01bc\u0005"+
		">\u0000\u0000\u01bb\u01b6\u0001\u0000\u0000\u0000\u01bb\u01bc\u0001\u0000"+
		"\u0000\u0000\u01bc\u01bd\u0001\u0000\u0000\u0000\u01bd\u01be\u0003\u0082"+
		"A\u0000\u01be\u01bf\u0003\b\u0004\u0000\u01bfC\u0001\u0000\u0000\u0000"+
		"\u01c0\u01c1\u0003^/\u0000\u01c1\u01c5\u0007\u0002\u0000\u0000\u01c2\u01c6"+
		"\u0003L&\u0000\u01c3\u01c6\u0003R)\u0000\u01c4\u01c6\u0003T*\u0000\u01c5"+
		"\u01c2\u0001\u0000\u0000\u0000\u01c5\u01c3\u0001\u0000\u0000\u0000\u01c5"+
		"\u01c4\u0001\u0000\u0000\u0000\u01c6\u01c7\u0001\u0000\u0000\u0000\u01c7"+
		"\u01c8\u0005@\u0000\u0000\u01c8E\u0001\u0000\u0000\u0000\u01c9\u01ca\u0003"+
		"L&\u0000\u01ca\u01cb\u0005@\u0000\u0000\u01cbG\u0001\u0000\u0000\u0000"+
		"\u01cc\u01cd\u0005\u0005\u0000\u0000\u01cd\u01cf\u0005;\u0000\u0000\u01ce"+
		"\u01d0\u0005r\u0000\u0000\u01cf\u01ce\u0001\u0000\u0000\u0000\u01cf\u01d0"+
		"\u0001\u0000\u0000\u0000\u01d0\u01d1\u0001\u0000\u0000\u0000\u01d1\u01d2"+
		"\u0005<\u0000\u0000\u01d2I\u0001\u0000\u0000\u0000\u01d3\u01d4\u0005\u0006"+
		"\u0000\u0000\u01d4\u01da\u0003n7\u0000\u01d5\u01d7\u0005=\u0000\u0000"+
		"\u01d6\u01d8\u0003|>\u0000\u01d7\u01d6\u0001\u0000\u0000\u0000\u01d7\u01d8"+
		"\u0001\u0000\u0000\u0000\u01d8\u01d9\u0001\u0000\u0000\u0000\u01d9\u01db"+
		"\u0005>\u0000\u0000\u01da\u01d5\u0001\u0000\u0000\u0000\u01da\u01db\u0001"+
		"\u0000\u0000\u0000\u01db\u01dc\u0001\u0000\u0000\u0000\u01dc\u01de\u0003"+
		"~?\u0000\u01dd\u01df\u0003`0\u0000\u01de\u01dd\u0001\u0000\u0000\u0000"+
		"\u01de\u01df\u0001\u0000\u0000\u0000\u01df\u01e0\u0001\u0000\u0000\u0000"+
		"\u01e0\u01e2\u0005;\u0000\u0000\u01e1\u01e3\u0005r\u0000\u0000\u01e2\u01e1"+
		"\u0001\u0000\u0000\u0000\u01e2\u01e3\u0001\u0000\u0000\u0000\u01e3\u01e4"+
		"\u0001\u0000\u0000\u0000\u01e4\u01e5\u0005<\u0000\u0000\u01e5K\u0001\u0000"+
		"\u0000\u0000\u01e6\u01e7\u0006&\uffff\uffff\u0000\u01e7\u01e8\u0005=\u0000"+
		"\u0000\u01e8\u01e9\u0003L&\u0000\u01e9\u01ea\u0005>\u0000\u0000\u01ea"+
		"\u0202\u0001\u0000\u0000\u0000\u01eb\u01ec\u0007\u0003\u0000\u0000\u01ec"+
		"\u0202\u0003L&\u000f\u01ed\u01f0\u0003d2\u0000\u01ee\u01f0\u0003h4\u0000"+
		"\u01ef\u01ed\u0001\u0000\u0000\u0000\u01ef\u01ee\u0001\u0000\u0000\u0000"+
		"\u01f0\u01f1\u0001\u0000\u0000\u0000\u01f1\u01f2\u0005=\u0000\u0000\u01f2"+
		"\u01f3\u0003L&\u0000\u01f3\u01f4\u0005>\u0000\u0000\u01f4\u0202\u0001"+
		"\u0000\u0000\u0000\u01f5\u01f6\u00053\u0000\u0000\u01f6\u01f7\u0005=\u0000"+
		"\u0000\u01f7\u01f8\u0003\b\u0004\u0000\u01f8\u01f9\u0005>\u0000\u0000"+
		"\u01f9\u0202\u0001\u0000\u0000\u0000\u01fa\u01fb\u0005^\u0000\u0000\u01fb"+
		"\u01fd\u0005=\u0000\u0000\u01fc\u01fe\u0003\u0080@\u0000\u01fd\u01fc\u0001"+
		"\u0000\u0000\u0000\u01fd\u01fe\u0001\u0000\u0000\u0000\u01fe\u01ff\u0001"+
		"\u0000\u0000\u0000\u01ff\u0202\u0005>\u0000\u0000\u0200\u0202\u0007\u0004"+
		"\u0000\u0000\u0201\u01e6\u0001\u0000\u0000\u0000\u0201\u01eb\u0001\u0000"+
		"\u0000\u0000\u0201\u01ef\u0001\u0000\u0000\u0000\u0201\u01f5\u0001\u0000"+
		"\u0000\u0000\u0201\u01fa\u0001\u0000\u0000\u0000\u0201\u0200\u0001\u0000"+
		"\u0000\u0000\u0202\u0228\u0001\u0000\u0000\u0000\u0203\u0204\n\u0010\u0000"+
		"\u0000\u0204\u0205\u0005I\u0000\u0000\u0205\u0227\u0003L&\u0010\u0206"+
		"\u0207\n\u000e\u0000\u0000\u0207\u0208\u0007\u0005\u0000\u0000\u0208\u0227"+
		"\u0003L&\u000f\u0209\u020a\n\r\u0000\u0000\u020a\u020b\u0007\u0006\u0000"+
		"\u0000\u020b\u0227\u0003L&\u000e\u020c\u020d\n\f\u0000\u0000\u020d\u020e"+
		"\u0005W\u0000\u0000\u020e\u0227\u0003L&\r\u020f\u0210\n\u000b\u0000\u0000"+
		"\u0210\u0211\u0005V\u0000\u0000\u0211\u0227\u0003L&\f\u0212\u0213\n\n"+
		"\u0000\u0000\u0213\u0214\u0005T\u0000\u0000\u0214\u0227\u0003L&\u000b"+
		"\u0215\u0216\n\t\u0000\u0000\u0216\u0217\u0005N\u0000\u0000\u0217\u0227"+
		"\u0003L&\n\u0218\u0219\n\b\u0000\u0000\u0219\u021a\u0005P\u0000\u0000"+
		"\u021a\u0227\u0003L&\t\u021b\u021c\n\u0007\u0000\u0000\u021c\u021d\u0005"+
		"L\u0000\u0000\u021d\u0227\u0003L&\b\u021e\u021f\n\u0006\u0000\u0000\u021f"+
		"\u0220\u0005O\u0000\u0000\u0220\u0227\u0003L&\u0007\u0221\u0222\n\u0005"+
		"\u0000\u0000\u0222\u0223\u0005M\u0000\u0000\u0223\u0227\u0003L&\u0006"+
		"\u0224\u0225\n\u0011\u0000\u0000\u0225\u0227\u0003\\.\u0000\u0226\u0203"+
		"\u0001\u0000\u0000\u0000\u0226\u0206\u0001\u0000\u0000\u0000\u0226\u0209"+
		"\u0001\u0000\u0000\u0000\u0226\u020c\u0001\u0000\u0000\u0000\u0226\u020f"+
		"\u0001\u0000\u0000\u0000\u0226\u0212\u0001\u0000\u0000\u0000\u0226\u0215"+
		"\u0001\u0000\u0000\u0000\u0226\u0218\u0001\u0000\u0000\u0000\u0226\u021b"+
		"\u0001\u0000\u0000\u0000\u0226\u021e\u0001\u0000\u0000\u0000\u0226\u0221"+
		"\u0001\u0000\u0000\u0000\u0226\u0224\u0001\u0000\u0000\u0000\u0227\u022a"+
		"\u0001\u0000\u0000\u0000\u0228\u0226\u0001\u0000\u0000\u0000\u0228\u0229"+
		"\u0001\u0000\u0000\u0000\u0229M\u0001\u0000\u0000\u0000\u022a\u0228\u0001"+
		"\u0000\u0000\u0000\u022b\u0230\u0003L&\u0000\u022c\u022d\u0005F\u0000"+
		"\u0000\u022d\u022f\u0003L&\u0000\u022e\u022c\u0001\u0000\u0000\u0000\u022f"+
		"\u0232\u0001\u0000\u0000\u0000\u0230\u022e\u0001\u0000\u0000\u0000\u0230"+
		"\u0231\u0001\u0000\u0000\u0000\u0231O\u0001\u0000\u0000\u0000\u0232\u0230"+
		"\u0001\u0000\u0000\u0000\u0233\u0238\u0003Z-\u0000\u0234\u0238\u0003L"+
		"&\u0000\u0235\u0238\u0003R)\u0000\u0236\u0238\u0003T*\u0000\u0237\u0233"+
		"\u0001\u0000\u0000\u0000\u0237\u0234\u0001\u0000\u0000\u0000\u0237\u0235"+
		"\u0001\u0000\u0000\u0000\u0237\u0236\u0001\u0000\u0000\u0000\u0238Q\u0001"+
		"\u0000\u0000\u0000\u0239\u023a\u00056\u0000\u0000\u023a\u023b\u0003t:"+
		"\u0000\u023bS\u0001\u0000\u0000\u0000\u023c\u0242\u0005^\u0000\u0000\u023d"+
		"\u023f\u0005=\u0000\u0000\u023e\u0240\u0003\u0080@\u0000\u023f\u023e\u0001"+
		"\u0000\u0000\u0000\u023f\u0240\u0001\u0000\u0000\u0000\u0240\u0241\u0001"+
		"\u0000\u0000\u0000\u0241\u0243\u0005>\u0000\u0000\u0242\u023d\u0001\u0000"+
		"\u0000\u0000\u0242\u0243\u0001\u0000\u0000\u0000\u0243\u0244\u0001\u0000"+
		"\u0000\u0000\u0244\u0245\u0003\u0084B\u0000\u0245U\u0001\u0000\u0000\u0000"+
		"\u0246\u0248\u0003L&\u0000\u0247\u0246\u0001\u0000\u0000\u0000\u0247\u0248"+
		"\u0001\u0000\u0000\u0000\u0248\u0249\u0001\u0000\u0000\u0000\u0249\u024b"+
		"\u0005?\u0000\u0000\u024a\u024c\u0003L&\u0000\u024b\u024a\u0001\u0000"+
		"\u0000\u0000\u024b\u024c\u0001\u0000\u0000\u0000\u024c\u024f\u0001\u0000"+
		"\u0000\u0000\u024d\u024e\u0005?\u0000\u0000\u024e\u0250\u0003L&\u0000"+
		"\u024f\u024d\u0001\u0000\u0000\u0000\u024f\u0250\u0001\u0000\u0000\u0000"+
		"\u0250W\u0001\u0000\u0000\u0000\u0251\u0252\u0005;\u0000\u0000\u0252\u0257"+
		"\u0003L&\u0000\u0253\u0254\u0005B\u0000\u0000\u0254\u0256\u0003L&\u0000"+
		"\u0255\u0253\u0001\u0000\u0000\u0000\u0256\u0259\u0001\u0000\u0000\u0000"+
		"\u0257\u0255\u0001\u0000\u0000\u0000\u0257\u0258\u0001\u0000\u0000\u0000"+
		"\u0258\u025b\u0001\u0000\u0000\u0000\u0259\u0257\u0001\u0000\u0000\u0000"+
		"\u025a\u025c\u0005B\u0000\u0000\u025b\u025a\u0001\u0000\u0000\u0000\u025b"+
		"\u025c\u0001\u0000\u0000\u0000\u025c\u025d\u0001\u0000\u0000\u0000\u025d"+
		"\u025e\u0005<\u0000\u0000\u025eY\u0001\u0000\u0000\u0000\u025f\u0271\u0005"+
		";\u0000\u0000\u0260\u0263\u0003L&\u0000\u0261\u0263\u0003Z-\u0000\u0262"+
		"\u0260\u0001\u0000\u0000\u0000\u0262\u0261\u0001\u0000\u0000\u0000\u0263"+
		"\u026b\u0001\u0000\u0000\u0000\u0264\u0267\u0005B\u0000\u0000\u0265\u0268"+
		"\u0003L&\u0000\u0266\u0268\u0003Z-\u0000\u0267\u0265\u0001\u0000\u0000"+
		"\u0000\u0267\u0266\u0001\u0000\u0000\u0000\u0268\u026a\u0001\u0000\u0000"+
		"\u0000\u0269\u0264\u0001\u0000\u0000\u0000\u026a\u026d\u0001\u0000\u0000"+
		"\u0000\u026b\u0269\u0001\u0000\u0000\u0000\u026b\u026c\u0001\u0000\u0000"+
		"\u0000\u026c\u026f\u0001\u0000\u0000\u0000\u026d\u026b\u0001\u0000\u0000"+
		"\u0000\u026e\u0270\u0005B\u0000\u0000\u026f\u026e\u0001\u0000\u0000\u0000"+
		"\u026f\u0270\u0001\u0000\u0000\u0000\u0270\u0272\u0001\u0000\u0000\u0000"+
		"\u0271\u0262\u0001\u0000\u0000\u0000\u0271\u0272\u0001\u0000\u0000\u0000"+
		"\u0272\u0273\u0001\u0000\u0000\u0000\u0273\u0274\u0005<\u0000\u0000\u0274"+
		"[\u0001\u0000\u0000\u0000\u0275\u0288\u00059\u0000\u0000\u0276\u0289\u0003"+
		"X,\u0000\u0277\u027a\u0003L&\u0000\u0278\u027a\u0003V+\u0000\u0279\u0277"+
		"\u0001\u0000\u0000\u0000\u0279\u0278\u0001\u0000\u0000\u0000\u027a\u0282"+
		"\u0001\u0000\u0000\u0000\u027b\u027e\u0005B\u0000\u0000\u027c\u027f\u0003"+
		"L&\u0000\u027d\u027f\u0003V+\u0000\u027e\u027c\u0001\u0000\u0000\u0000"+
		"\u027e\u027d\u0001\u0000\u0000\u0000\u027f\u0281\u0001\u0000\u0000\u0000"+
		"\u0280\u027b\u0001\u0000\u0000\u0000\u0281\u0284\u0001\u0000\u0000\u0000"+
		"\u0282\u0280\u0001\u0000\u0000\u0000\u0282\u0283\u0001\u0000\u0000\u0000"+
		"\u0283\u0286\u0001\u0000\u0000\u0000\u0284\u0282\u0001\u0000\u0000\u0000"+
		"\u0285\u0287\u0005B\u0000\u0000\u0286\u0285\u0001\u0000\u0000\u0000\u0286"+
		"\u0287\u0001\u0000\u0000\u0000\u0287\u0289\u0001\u0000\u0000\u0000\u0288"+
		"\u0276\u0001\u0000\u0000\u0000\u0288\u0279\u0001\u0000\u0000\u0000\u0289"+
		"\u028a\u0001\u0000\u0000\u0000\u028a\u028b\u0005:\u0000\u0000\u028b]\u0001"+
		"\u0000\u0000\u0000\u028c\u0290\u0005^\u0000\u0000\u028d\u028f\u0003\\"+
		".\u0000\u028e\u028d\u0001\u0000\u0000\u0000\u028f\u0292\u0001\u0000\u0000"+
		"\u0000\u0290\u028e\u0001\u0000\u0000\u0000\u0290\u0291\u0001\u0000\u0000"+
		"\u0000\u0291_\u0001\u0000\u0000\u0000\u0292\u0290\u0001\u0000\u0000\u0000"+
		"\u0293\u0294\u0005D\u0000\u0000\u0294\u0295\u0003d2\u0000\u0295a\u0001"+
		"\u0000\u0000\u0000\u0296\u02a4\u0005.\u0000\u0000\u0297\u0298\u0005/\u0000"+
		"\u0000\u0298\u0299\u0005=\u0000\u0000\u0299\u029a\u0003L&\u0000\u029a"+
		"\u029b\u0005>\u0000\u0000\u029b\u02a4\u0001\u0000\u0000\u0000\u029c\u02a1"+
		"\u0007\u0007\u0000\u0000\u029d\u029e\u0005=\u0000\u0000\u029e\u029f\u0003"+
		"L&\u0000\u029f\u02a0\u0005>\u0000\u0000\u02a0\u02a2\u0001\u0000\u0000"+
		"\u0000\u02a1\u029d\u0001\u0000\u0000\u0000\u02a1\u02a2\u0001\u0000\u0000"+
		"\u0000\u02a2\u02a4\u0001\u0000\u0000\u0000\u02a3\u0296\u0001\u0000\u0000"+
		"\u0000\u02a3\u0297\u0001\u0000\u0000\u0000\u02a3\u029c\u0001\u0000\u0000"+
		"\u0000\u02a4\u02a5\u0001\u0000\u0000\u0000\u02a5\u02a6\u0005Q\u0000\u0000"+
		"\u02a6c\u0001\u0000\u0000\u0000\u02a7\u02a9\u0005#\u0000\u0000\u02a8\u02aa"+
		"\u0003l6\u0000\u02a9\u02a8\u0001\u0000\u0000\u0000\u02a9\u02aa\u0001\u0000"+
		"\u0000\u0000\u02aa\u02c6\u0001\u0000\u0000\u0000\u02ab\u02ad\u0005$\u0000"+
		"\u0000\u02ac\u02ae\u0003l6\u0000\u02ad\u02ac\u0001\u0000\u0000\u0000\u02ad"+
		"\u02ae\u0001\u0000\u0000\u0000\u02ae\u02c6\u0001\u0000\u0000\u0000\u02af"+
		"\u02b1\u0005%\u0000\u0000\u02b0\u02b2\u0003l6\u0000\u02b1\u02b0\u0001"+
		"\u0000\u0000\u0000\u02b1\u02b2\u0001\u0000\u0000\u0000\u02b2\u02c6\u0001"+
		"\u0000\u0000\u0000\u02b3\u02b5\u0005&\u0000\u0000\u02b4\u02b6\u0003l6"+
		"\u0000\u02b5\u02b4\u0001\u0000\u0000\u0000\u02b5\u02b6\u0001\u0000\u0000"+
		"\u0000\u02b6\u02c6\u0001\u0000\u0000\u0000\u02b7\u02b9\u0005\'\u0000\u0000"+
		"\u02b8\u02ba\u0003l6\u0000\u02b9\u02b8\u0001\u0000\u0000\u0000\u02b9\u02ba"+
		"\u0001\u0000\u0000\u0000\u02ba\u02c6\u0001\u0000\u0000\u0000\u02bb\u02c6"+
		"\u0005\"\u0000\u0000\u02bc\u02c6\u0005+\u0000\u0000\u02bd\u02c6\u0005"+
		",\u0000\u0000\u02be\u02c3\u0005(\u0000\u0000\u02bf\u02c0\u00059\u0000"+
		"\u0000\u02c0\u02c1\u0003d2\u0000\u02c1\u02c2\u0005:\u0000\u0000\u02c2"+
		"\u02c4\u0001\u0000\u0000\u0000\u02c3\u02bf\u0001\u0000\u0000\u0000\u02c3"+
		"\u02c4\u0001\u0000\u0000\u0000\u02c4\u02c6\u0001\u0000\u0000\u0000\u02c5"+
		"\u02a7\u0001\u0000\u0000\u0000\u02c5\u02ab\u0001\u0000\u0000\u0000\u02c5"+
		"\u02af\u0001\u0000\u0000\u0000\u02c5\u02b3\u0001\u0000\u0000\u0000\u02c5"+
		"\u02b7\u0001\u0000\u0000\u0000\u02c5\u02bb\u0001\u0000\u0000\u0000\u02c5"+
		"\u02bc\u0001\u0000\u0000\u0000\u02c5\u02bd\u0001\u0000\u0000\u0000\u02c5"+
		"\u02be\u0001\u0000\u0000\u0000\u02c6e\u0001\u0000\u0000\u0000\u02c7\u02c9"+
		"\u0005 \u0000\u0000\u02c8\u02ca\u0003l6\u0000\u02c9\u02c8\u0001\u0000"+
		"\u0000\u0000\u02c9\u02ca\u0001\u0000\u0000\u0000\u02cag\u0001\u0000\u0000"+
		"\u0000\u02cb\u02cc\u0005)\u0000\u0000\u02cc\u02cd\u00059\u0000\u0000\u02cd"+
		"\u02ce\u0003d2\u0000\u02ce\u02cf\u0005B\u0000\u0000\u02cf\u02d0\u0003"+
		"\u0080@\u0000\u02d0\u02d1\u0005:\u0000\u0000\u02d1i\u0001\u0000\u0000"+
		"\u0000\u02d2\u02d3\u0007\b\u0000\u0000\u02d3\u02d4\u0005)\u0000\u0000"+
		"\u02d4\u02d5\u00059\u0000\u0000\u02d5\u02d6\u0003d2\u0000\u02d6\u02db"+
		"\u0005B\u0000\u0000\u02d7\u02dc\u0003\u0080@\u0000\u02d8\u02d9\u00052"+
		"\u0000\u0000\u02d9\u02da\u0005C\u0000\u0000\u02da\u02dc\u0003L&\u0000"+
		"\u02db\u02d7\u0001\u0000\u0000\u0000\u02db\u02d8\u0001\u0000\u0000\u0000"+
		"\u02dc\u02dd\u0001\u0000\u0000\u0000\u02dd\u02de\u0005:\u0000\u0000\u02de"+
		"k\u0001\u0000\u0000\u0000\u02df\u02e0\u00059\u0000\u0000\u02e0\u02e1\u0003"+
		"L&\u0000\u02e1\u02e2\u0005:\u0000\u0000\u02e2m\u0001\u0000\u0000\u0000"+
		"\u02e3\u02e4\u0007\t\u0000\u0000\u02e4o\u0001\u0000\u0000\u0000\u02e5"+
		"\u02e8\u0003L&\u0000\u02e6\u02e8\u0003x<\u0000\u02e7\u02e5\u0001\u0000"+
		"\u0000\u0000\u02e7\u02e6\u0001\u0000\u0000\u0000\u02e8q\u0001\u0000\u0000"+
		"\u0000\u02e9\u02ea\u0007\n\u0000\u0000\u02eas\u0001\u0000\u0000\u0000"+
		"\u02eb\u02ee\u0003^/\u0000\u02ec\u02ee\u0005_\u0000\u0000\u02ed\u02eb"+
		"\u0001\u0000\u0000\u0000\u02ed\u02ec\u0001\u0000\u0000\u0000\u02eeu\u0001"+
		"\u0000\u0000\u0000\u02ef\u02f6\u0003d2\u0000\u02f0\u02f6\u0003j5\u0000"+
		"\u02f1\u02f3\u0005!\u0000\u0000\u02f2\u02f4\u0003l6\u0000\u02f3\u02f2"+
		"\u0001\u0000\u0000\u0000\u02f3\u02f4\u0001\u0000\u0000\u0000\u02f4\u02f6"+
		"\u0001\u0000\u0000\u0000\u02f5\u02ef\u0001\u0000\u0000\u0000\u02f5\u02f0"+
		"\u0001\u0000\u0000\u0000\u02f5\u02f1\u0001\u0000\u0000\u0000\u02f6w\u0001"+
		"\u0000\u0000\u0000\u02f7\u02f8\u0003d2\u0000\u02f8\u02f9\u0005^\u0000"+
		"\u0000\u02f9\u0306\u0001\u0000\u0000\u0000\u02fa\u02fb\u0003f3\u0000\u02fb"+
		"\u02fc\u0005^\u0000\u0000\u02fc\u0306\u0001\u0000\u0000\u0000\u02fd\u02fe"+
		"\u0007\u0001\u0000\u0000\u02fe\u0300\u0005^\u0000\u0000\u02ff\u0301\u0003"+
		"l6\u0000\u0300\u02ff\u0001\u0000\u0000\u0000\u0300\u0301\u0001\u0000\u0000"+
		"\u0000\u0301\u0306\u0001\u0000\u0000\u0000\u0302\u0303\u0003j5\u0000\u0303"+
		"\u0304\u0005^\u0000\u0000\u0304\u0306\u0001\u0000\u0000\u0000\u0305\u02f7"+
		"\u0001\u0000\u0000\u0000\u0305\u02fa\u0001\u0000\u0000\u0000\u0305\u02fd"+
		"\u0001\u0000\u0000\u0000\u0305\u0302\u0001\u0000\u0000\u0000\u0306y\u0001"+
		"\u0000\u0000\u0000\u0307\u030c\u0003x<\u0000\u0308\u0309\u0005B\u0000"+
		"\u0000\u0309\u030b\u0003x<\u0000\u030a\u0308\u0001\u0000\u0000\u0000\u030b"+
		"\u030e\u0001\u0000\u0000\u0000\u030c\u030a\u0001\u0000\u0000\u0000\u030c"+
		"\u030d\u0001\u0000\u0000\u0000\u030d\u0310\u0001\u0000\u0000\u0000\u030e"+
		"\u030c\u0001\u0000\u0000\u0000\u030f\u0311\u0005B\u0000\u0000\u0310\u030f"+
		"\u0001\u0000\u0000\u0000\u0310\u0311\u0001\u0000\u0000\u0000\u0311{\u0001"+
		"\u0000\u0000\u0000\u0312\u0317\u0003p8\u0000\u0313\u0314\u0005B\u0000"+
		"\u0000\u0314\u0316\u0003p8\u0000\u0315\u0313\u0001\u0000\u0000\u0000\u0316"+
		"\u0319\u0001\u0000\u0000\u0000\u0317\u0315\u0001\u0000\u0000\u0000\u0317"+
		"\u0318\u0001\u0000\u0000\u0000\u0318\u031b\u0001\u0000\u0000\u0000\u0319"+
		"\u0317\u0001\u0000\u0000\u0000\u031a\u031c\u0005B\u0000\u0000\u031b\u031a"+
		"\u0001\u0000\u0000\u0000\u031b\u031c\u0001\u0000\u0000\u0000\u031c}\u0001"+
		"\u0000\u0000\u0000\u031d\u0322\u0003r9\u0000\u031e\u031f\u0005B\u0000"+
		"\u0000\u031f\u0321\u0003r9\u0000\u0320\u031e\u0001\u0000\u0000\u0000\u0321"+
		"\u0324\u0001\u0000\u0000\u0000\u0322\u0320\u0001\u0000\u0000\u0000\u0322"+
		"\u0323\u0001\u0000\u0000\u0000\u0323\u0326\u0001\u0000\u0000\u0000\u0324"+
		"\u0322\u0001\u0000\u0000\u0000\u0325\u0327\u0005B\u0000\u0000\u0326\u0325"+
		"\u0001\u0000\u0000\u0000\u0326\u0327\u0001\u0000\u0000\u0000\u0327\u007f"+
		"\u0001\u0000\u0000\u0000\u0328\u032d\u0003L&\u0000\u0329\u032a\u0005B"+
		"\u0000\u0000\u032a\u032c\u0003L&\u0000\u032b\u0329\u0001\u0000\u0000\u0000"+
		"\u032c\u032f\u0001\u0000\u0000\u0000\u032d\u032b\u0001\u0000\u0000\u0000"+
		"\u032d\u032e\u0001\u0000\u0000\u0000\u032e\u0331\u0001\u0000\u0000\u0000"+
		"\u032f\u032d\u0001\u0000\u0000\u0000\u0330\u0332\u0005B\u0000\u0000\u0331"+
		"\u0330\u0001\u0000\u0000\u0000\u0331\u0332\u0001\u0000\u0000\u0000\u0332"+
		"\u0081\u0001\u0000\u0000\u0000\u0333\u0338\u0005^\u0000\u0000\u0334\u0335"+
		"\u0005B\u0000\u0000\u0335\u0337\u0005^\u0000\u0000\u0336\u0334\u0001\u0000"+
		"\u0000\u0000\u0337\u033a\u0001\u0000\u0000\u0000\u0338\u0336\u0001\u0000"+
		"\u0000\u0000\u0338\u0339\u0001\u0000\u0000\u0000\u0339\u033c\u0001\u0000"+
		"\u0000\u0000\u033a\u0338\u0001\u0000\u0000\u0000\u033b\u033d\u0005B\u0000"+
		"\u0000\u033c\u033b\u0001\u0000\u0000\u0000\u033c\u033d\u0001\u0000\u0000"+
		"\u0000\u033d\u0083\u0001\u0000\u0000\u0000\u033e\u0343\u0003t:\u0000\u033f"+
		"\u0340\u0005B\u0000\u0000\u0340\u0342\u0003t:\u0000\u0341\u033f\u0001"+
		"\u0000\u0000\u0000\u0342\u0345\u0001\u0000\u0000\u0000\u0343\u0341\u0001"+
		"\u0000\u0000\u0000\u0343\u0344\u0001\u0000\u0000\u0000\u0344\u0347\u0001"+
		"\u0000\u0000\u0000\u0345\u0343\u0001\u0000\u0000\u0000\u0346\u0348\u0005"+
		"B\u0000\u0000\u0347\u0346\u0001\u0000\u0000\u0000\u0347\u0348\u0001\u0000"+
		"\u0000\u0000\u0348\u0085\u0001\u0000\u0000\u0000\u0349\u034e\u0003v;\u0000"+
		"\u034a\u034b\u0005B\u0000\u0000\u034b\u034d\u0003v;\u0000\u034c\u034a"+
		"\u0001\u0000\u0000\u0000\u034d\u0350\u0001\u0000\u0000\u0000\u034e\u034c"+
		"\u0001\u0000\u0000\u0000\u034e\u034f\u0001\u0000\u0000\u0000\u034f\u0352"+
		"\u0001\u0000\u0000\u0000\u0350\u034e\u0001\u0000\u0000\u0000\u0351\u0353"+
		"\u0005B\u0000\u0000\u0352\u0351\u0001\u0000\u0000\u0000\u0352\u0353\u0001"+
		"\u0000\u0000\u0000\u0353\u0087\u0001\u0000\u0000\u0000e\u0089\u008e\u009b"+
		"\u00bc\u00be\u00c2\u00c8\u00d2\u00ef\u00fa\u0100\u0112\u011d\u0121\u0127"+
		"\u012e\u0134\u013b\u0141\u0144\u0147\u014f\u0155\u0158\u015b\u015e\u0161"+
		"\u0165\u0169\u0179\u017e\u018c\u0194\u01a0\u01a4\u01ac\u01b0\u01b8\u01bb"+
		"\u01c5\u01cf\u01d7\u01da\u01de\u01e2\u01ef\u01fd\u0201\u0226\u0228\u0230"+
		"\u0237\u023f\u0242\u0247\u024b\u024f\u0257\u025b\u0262\u0267\u026b\u026f"+
		"\u0271\u0279\u027e\u0282\u0286\u0288\u0290\u02a1\u02a3\u02a9\u02ad\u02b1"+
		"\u02b5\u02b9\u02c3\u02c5\u02c9\u02db\u02e7\u02ed\u02f3\u02f5\u0300\u0305"+
		"\u030c\u0310\u0317\u031b\u0322\u0326\u032d\u0331\u0338\u033c\u0343\u0347"+
		"\u034e\u0352";
	public static final ATN _ATN =
		new ATNDeserializer().deserialize(_serializedATN.toCharArray());
	static {
		_decisionToDFA = new DFA[_ATN.getNumberOfDecisions()];
		for (int i = 0; i < _ATN.getNumberOfDecisions(); i++) {
			_decisionToDFA[i] = new DFA(_ATN.getDecisionState(i), i);
		}
	}
}