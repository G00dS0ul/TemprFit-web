'use client';

import React from 'react';
import styles from './AIResponseRenderer.module.css';

/**
 * Parses markdown text (headers, bold, italic, bullet points, numbered lists,
 * inline code, code blocks, and markdown tables) into clean semantic HTML without
 * heavyweight third-party dependencies.
 */
export default function AIResponseRenderer({ content }) {
  if (!content) return null;

  const renderedElements = parseMarkdown(content);

  return <div className={styles.richContainer}>{renderedElements}</div>;
}

function parseMarkdown(text) {
  if (typeof text !== 'string') return text;

  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // 2. Check for Table block (starts with | ... | and header separator line |---|...)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      elements.push(renderTable(tableLines, elements.length));
      continue;
    }

    // 3. Check for Code Block (```)
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <pre key={elements.length} className={styles.codeBlock}>
          {lang && <div className={styles.codeLang}>{lang}</div>}
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // 4. Headers (###, ##, #)
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={elements.length} className={styles.h4}>
          {formatInline(trimmed.slice(4))}
        </h4>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={elements.length} className={styles.h3}>
          {formatInline(trimmed.slice(3))}
        </h3>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h2 key={elements.length} className={styles.h2}>
          {formatInline(trimmed.slice(2))}
        </h2>
      );
      i++;
      continue;
    }

    // 5. Unordered List (bullet points - or *)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const listItems = [];
      while (
        i < lines.length &&
        (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))
      ) {
        listItems.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={elements.length} className={styles.bulletList}>
          {listItems.map((item, idx) => (
            <li key={idx}>{formatInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // 6. Numbered List (1. 2. etc)
    if (/^\d+\.\s/.test(trimmed)) {
      const listItems = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^\d+\.\s+/, '');
        listItems.push(itemText);
        i++;
      }
      elements.push(
        <ol key={elements.length} className={styles.numList}>
          {listItems.map((item, idx) => (
            <li key={idx}>{formatInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // 7. Regular paragraph
    elements.push(
      <p key={elements.length} className={styles.paragraph}>
        {formatInline(line)}
      </p>
    );
    i++;
  }

  return elements;
}

function renderTable(tableLines, key) {
  if (tableLines.length < 2) {
    return <div key={key}>{tableLines.join('\n')}</div>;
  }

  const parseRow = (rowStr) => {
    return rowStr
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
  };

  const headerCols = parseRow(tableLines[0]);
  let rowStartIndex = 1;

  // check if row 1 is a separator like |---|---|
  if (tableLines[1].replace(/[\s|:-]/g, '') === '') {
    rowStartIndex = 2;
  }

  const bodyRows = tableLines.slice(rowStartIndex).map(parseRow);

  return (
    <div key={key} className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {headerCols.map((col, idx) => (
              <th key={idx}>{formatInline(col)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cell, cIdx) => (
                <td key={cIdx}>{formatInline(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Handles inline formatting: **bold**, *italic*, `code`
 */
function formatInline(text) {
  if (!text) return '';

  const tokens = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(
        <strong key={match.index} className={styles.bold}>
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      tokens.push(<em key={match.index}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code key={match.index} className={styles.inlineCode}>
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.substring(lastIndex));
  }

  return tokens.length > 0 ? tokens : text;
}
