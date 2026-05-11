import { EJSON } from 'bson'
import * as prettier from 'prettier/standalone'
import * as prettierPluginBabel from 'prettier/plugins/babel'
import * as prettierPluginEstree from 'prettier/plugins/estree'
import { format as formatSql } from 'sql-formatter'

export type DatabaseDialect = 'mysql' | 'doris' | 'mongodb'
export type DatabaseKeywordCase = 'upper' | 'lower' | 'preserve'

export interface DatabaseFormatOptions {
  dialect: DatabaseDialect
  keywordCase: DatabaseKeywordCase
  tabWidth: number
  linesBetweenQueries: number
}

export interface DatabaseFormatResult {
  output: string
  mode: 'sql' | 'mongodb'
  dialectLabel: string
}

const DIALECT_LABELS: Record<DatabaseDialect, string> = {
  mysql: 'MySQL',
  doris: 'Doris (MySQL compatible)',
  mongodb: 'MongoDB Query',
}

export async function formatDatabaseQuery(
  source: string,
  options: DatabaseFormatOptions
): Promise<DatabaseFormatResult> {
  const trimmed = source.trim()

  if (!trimmed) {
    return {
      output: '',
      mode: options.dialect === 'mongodb' ? 'mongodb' : 'sql',
      dialectLabel: DIALECT_LABELS[options.dialect],
    }
  }

  if (options.dialect === 'mongodb') {
    return {
      output: await formatMongoQuery(trimmed, options.tabWidth),
      mode: 'mongodb',
      dialectLabel: DIALECT_LABELS.mongodb,
    }
  }

  return {
    output: formatSql(trimmed, {
      language: 'mysql',
      keywordCase: options.keywordCase,
      tabWidth: options.tabWidth,
      linesBetweenQueries: options.linesBetweenQueries,
    }).trimEnd(),
    mode: 'sql',
    dialectLabel: DIALECT_LABELS[options.dialect],
  }
}

async function formatMongoQuery(source: string, tabWidth: number): Promise<string> {
  if (source.startsWith('{') || source.startsWith('[')) {
    try {
      const parsed = EJSON.parse(source)
      return EJSON.stringify(parsed, undefined, tabWidth).trimEnd()
    } catch {
      // Fall through to Prettier so JavaScript-style object expressions get a useful error.
    }
  }

  return (
    await prettier.format(source, {
      parser: 'babel',
      plugins: [prettierPluginBabel, prettierPluginEstree],
      tabWidth,
      semi: false,
      singleQuote: false,
    })
  ).trimEnd()
}
