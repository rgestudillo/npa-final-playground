#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#include "common.h"
#include "scanner.h"

typedef struct
{
    const char *start;
    const char *current;
    int line;
} Scanner;

Scanner scanner;

typedef struct
{
    char key;
    int length;
    const char *rest;
    TokenType type;
} KeywordDetail;

KeywordDetail *keywordArray = NULL;

FILE *readFile(const char *path)
{
    FILE *file = fopen(path, "rb");

    if (file == NULL)
    {
        fprintf(stderr, "Could not open file \"%s\".\n", path);
        exit(74);
    }
    else
    {
        printf("WORKING \n");
    }

    fclose(file);
    return file;
}

void initScanner(const char *source, const char *filePath)
{
    scanner.start = source;
    scanner.current = source;
    scanner.line = 1;

    FILE *file = fopen(filePath, "r");
    if (!file)
    {
        fprintf(stderr, "Could not open file \"%s\".\n", filePath);
        printf("went here\n");
        exit(1);
    }

    // Temporary buffer for reading keywords
    char keyword[50];
    int keywordCount = 0;

    // First, count the number of keywords in the file
    while (fscanf(file, "%s", keyword) == 1)
    {
        keywordCount++;
    }
    rewind(file);

    // Allocate memory for the keyword array
    keywordArray = (KeywordDetail *)malloc(keywordCount * sizeof(KeywordDetail));
    if (keywordArray == NULL)
    {
        fprintf(stderr, "Memory allocation error\n");
        exit(1);
    }

    for (int i = 0; i < keywordCount; i++)
    {
        fscanf(file, "%s", keyword);
        // printf("keyword is: %s\n", keyword);
        keywordArray[i].key = keyword[0];
        keywordArray[i].length = strlen(keyword) - 1;
        keywordArray[i].rest = strdup(keyword + 1);
    }

    fclose(file);
}

static bool isAlpha(char c)
{
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_';
}

static bool isDigit(char c)
{
    return c >= '0' && c <= '9';
}

static bool isAtEnd()
{
    return *scanner.current == '\0';
}

static char advance()
{
    scanner.current++;
    return scanner.current[-1];
}

static char peek()
{
    return *scanner.current;
}

static char peekNext()
{
    if (isAtEnd())
        return '\0';
    return scanner.current[1];
}

static bool match(char expected)
{
    if (isAtEnd())
        return false;
    if (*scanner.current != expected)
        return false;
    scanner.current++;
    return true;
}

static Token makeToken(TokenType type)
{
    Token token;
    token.type = type;
    token.start = scanner.start;
    token.length = (int)(scanner.current - scanner.start);
    token.line = scanner.line;
    return token;
}

static Token errorToken(const char *message)
{
    Token token;
    token.type = TOKEN_ERROR;
    token.start = message;
    token.length = (int)strlen(message);
    token.line = scanner.line;
    return token;
}

static void skipWhitespace()
{
    for (;;)
    {
        char c = peek();
        switch (c)
        {
        case ' ':
        case '\r':
        case '\t':
            advance();
            break;
        case '\n':
            scanner.line++;
            advance();
            break;
        case '/':
            if (peekNext() == '/')
            {
                while (peek() != '\n' && !isAtEnd())
                    advance();
            }
            else
            {
                return;
            }
            break;
        default:
            return;
        }
    }
}

static TokenType checkKeyword(int start, int length, const char *rest, TokenType type)
{
    if (scanner.current - scanner.start == start + length && memcmp(scanner.start + start, rest, length) == 0)
    {
        return type;
    }
    return TOKEN_IDENTIFIER;
}

KeywordDetail final[16]; 

void populateFinalArray() {
    if (keywordArray != NULL) {
        final[0] = (KeywordDetail){keywordArray[0].key, keywordArray[0].length, keywordArray[0].rest, TOKEN_AND};
        final[1] = (KeywordDetail){keywordArray[1].key, keywordArray[1].length, keywordArray[1].rest, TOKEN_CLASS};
        final[2] = (KeywordDetail){keywordArray[2].key, keywordArray[2].length, keywordArray[2].rest, TOKEN_ELSE};
        final[3] = (KeywordDetail){keywordArray[3].key, keywordArray[3].length, keywordArray[3].rest, TOKEN_FALSE};
        final[4] = (KeywordDetail){keywordArray[4].key, keywordArray[4].length, keywordArray[4].rest, TOKEN_FOR};
        final[5] = (KeywordDetail){keywordArray[5].key, keywordArray[5].length, keywordArray[5].rest, TOKEN_FUN};
        final[6] = (KeywordDetail){keywordArray[6].key, keywordArray[6].length, keywordArray[6].rest, TOKEN_IF};
        final[7] = (KeywordDetail){keywordArray[7].key, keywordArray[7].length, keywordArray[7].rest, TOKEN_NIL};
        final[8] = (KeywordDetail){keywordArray[8].key, keywordArray[8].length, keywordArray[8].rest, TOKEN_OR};
        final[9] = (KeywordDetail){keywordArray[9].key, keywordArray[9].length, keywordArray[9].rest, TOKEN_PRINT};
        final[10] = (KeywordDetail){keywordArray[10].key, keywordArray[10].length, keywordArray[10].rest, TOKEN_RETURN};
        final[11] = (KeywordDetail){keywordArray[11].key, keywordArray[11].length, keywordArray[11].rest, TOKEN_SUPER};
        final[12] = (KeywordDetail){keywordArray[12].key, keywordArray[12].length, keywordArray[12].rest, TOKEN_THIS};
        final[13] = (KeywordDetail){keywordArray[13].key, keywordArray[13].length, keywordArray[13].rest, TOKEN_TRUE};
        final[14] = (KeywordDetail){keywordArray[14].key, keywordArray[14].length, keywordArray[14].rest, TOKEN_VAR};
        final[15] = (KeywordDetail){keywordArray[15].key, keywordArray[15].length, keywordArray[15].rest, TOKEN_WHILE};
    } else {
        fprintf(stderr, "Error: keywordArray is not initialized.\n");
        exit(1);
    }
}


static TokenType identifierType()
{
    populateFinalArray();
    for (int i = 0; i < 16; ++i)
    {
        if (scanner.start[0] == final[i].key)
        {
            if (strncmp(scanner.start + 1, final[i].rest, final[i].length) == 0)
            {
                return final[i].type;
            }
        }
    }

    return TOKEN_IDENTIFIER;
}

static Token identifier()
{
    while (isAlpha(peek()) || isDigit(peek()))
        advance();
    return makeToken(identifierType());
}

static Token number()
{
    while (isDigit(peek()))
        advance();

    // Fraction??
    if (peek() == '.' && isDigit(peekNext()))
    {
        // Consume "."
        advance();

        while (isDigit(peek()))
            advance();
    }

    return makeToken(TOKEN_NUMBER);
}

static Token string()
{
    while (peek() != '"' && !isAtEnd())
    {
        if (peek() == '\n')
            scanner.line++;
        advance();
    }

    if (isAtEnd())
        return errorToken("Unterminated string.");

    // closing quote
    advance();
    return makeToken(TOKEN_STRING);
}

Token scanToken()
{
    skipWhitespace();
    scanner.start = scanner.current;

    if (isAtEnd())
        return makeToken(TOKEN_EOF);

    char c = advance();
    if (isAlpha(c))
        return identifier();
    if (isDigit(c))
        return number();

    switch (c)
    {
    case '(':
        return makeToken(TOKEN_LEFT_PAREN);
    case ')':
        return makeToken(TOKEN_RIGHT_PAREN);
    case '{':
        return makeToken(TOKEN_LEFT_BRACE);
    case '}':
        return makeToken(TOKEN_RIGHT_BRACE);
    case ';':
        return makeToken(TOKEN_SEMICOLON);
    case ',':
        return makeToken(TOKEN_COMMA);
    case '.':
        return makeToken(TOKEN_DOT);
    case '-':
        return makeToken(TOKEN_MINUS);
    case '+':
        return makeToken(TOKEN_PLUS);
    case '/':
        return makeToken(TOKEN_SLASH);
    case '*':
        return makeToken(TOKEN_STAR);
    case '!':
        return makeToken(match('=') ? TOKEN_BANG_EQUAL : TOKEN_BANG);
    case '=':
        return makeToken(match('=') ? TOKEN_EQUAL_EQUAL : TOKEN_EQUAL);
    case '<':
        return makeToken(match('=') ? TOKEN_LESS_EQUAL : TOKEN_LESS);
    case '>':
        return makeToken(match('=') ? TOKEN_GREATER_EQUAL : TOKEN_GREATER);
    case '"':
        return string();
    }

    return errorToken("Unexpected character.");
}
