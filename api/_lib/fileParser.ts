/**
 * File Parser Utility - Extract text content from various file formats
 * Supports: Office docs, text files, code files, OpenDocument, etc.
 */

import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import officeparser from 'officeparser';

/**
 * Result from parsing a file
 */
export interface ParseResult {
    type: 'text' | 'image' | 'file' | 'unsupported';
    content?: string;      // For text type - extracted content
    dataUri?: string;      // For image/file type - data URI
    language?: string;     // For code files - syntax highlighting hint
    error?: string;        // For unsupported type
}

/**
 * MIME types that are images (pass through as input_image)
 */
const IMAGE_MIME_TYPES = new Set([
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
    'image/heic',
    'image/heif',
]);

/**
 * MIME types that should be passed as input_file (PDF)
 */
const PASSTHROUGH_FILE_TYPES = new Set([
    'application/pdf',
]);

/**
 * MIME types that are unsupported (audio, video, archives)
 */
const UNSUPPORTED_MIME_TYPES = new Set([
    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/flac',
    'audio/mp4',
    'audio/ogg',
    'audio/webm',
    // Video
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-matroska',
    'video/x-msvideo',
    // Archives
    'application/zip',
    'application/x-zip-compressed',
    'application/vnd.rar',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/gzip',
    'application/x-gzip',
]);

/**
 * Map MIME type to code language for syntax highlighting
 */
const CODE_LANGUAGE_MAP: Record<string, string> = {
    'application/json': 'json',
    'application/x-ndjson': 'json',
    'text/yaml': 'yaml',
    'application/xml': 'xml',
    'text/xml': 'xml',
    'text/html': 'html',
    'text/css': 'css',
    'application/javascript': 'javascript',
    'text/javascript': 'javascript',
    'application/typescript': 'typescript',
    'text/typescript': 'typescript',
    'application/x-ipynb+json': 'python',
};

/**
 * Text-based MIME types that can be decoded directly
 */
function isTextMimeType(mimeType: string): boolean {
    if (mimeType.startsWith('text/')) return true;
    const textTypes = [
        'application/json',
        'application/x-ndjson',
        'application/xml',
        'application/javascript',
        'application/typescript',
        'application/x-ipynb+json',
    ];
    return textTypes.includes(mimeType);
}

/**
 * Office document MIME types
 */
const OFFICE_MIME_TYPES: Record<string, 'docx' | 'doc' | 'xlsx' | 'xls' | 'pptx' | 'ppt' | 'odt' | 'ods' | 'odp' | 'rtf' | 'epub'> = {
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.oasis.opendocument.text': 'odt',
    'application/vnd.oasis.opendocument.spreadsheet': 'ods',
    'application/vnd.oasis.opendocument.presentation': 'odp',
    'application/rtf': 'rtf',
    'application/epub+zip': 'epub',
};

/**
 * Parse Jupyter Notebook content to readable text
 */
function parseIPYNB(jsonContent: string): string {
    try {
        const notebook = JSON.parse(jsonContent);
        const lines: string[] = [];

        const language = notebook.metadata?.language_info?.name ||
            notebook.metadata?.kernelspec?.language || 'python';
        lines.push(`# Jupyter Notebook (${language})`);
        lines.push('');

        if (notebook.cells && Array.isArray(notebook.cells)) {
            notebook.cells.forEach((cell: any, index: number) => {
                const cellNum = index + 1;
                const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source || '';

                if (cell.cell_type === 'markdown') {
                    lines.push(`## [Markdown Cell ${cellNum}]`);
                    lines.push(source);
                    lines.push('');
                } else if (cell.cell_type === 'code') {
                    lines.push(`## [Code Cell ${cellNum}]`);
                    lines.push('```' + language);
                    lines.push(source);
                    lines.push('```');
                    lines.push('');
                } else if (cell.cell_type === 'raw') {
                    lines.push(`## [Raw Cell ${cellNum}]`);
                    lines.push('```');
                    lines.push(source);
                    lines.push('```');
                    lines.push('');
                }
            });
        }

        return lines.join('\n');
    } catch {
        throw new Error('Invalid Jupyter Notebook format');
    }
}

/**
 * Parse Word document (.docx) using mammoth
 */
async function parseDocx(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
}

/**
 * Parse Excel file (.xlsx, .xls) using xlsx
 */
function parseExcel(buffer: Buffer): string {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const lines: string[] = [];

    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        if (sheet) {
            lines.push(`## Sheet: ${sheetName}`);
            const csv = XLSX.utils.sheet_to_csv(sheet);
            lines.push('```csv');
            lines.push(csv);
            lines.push('```');
            lines.push('');
        }
    }

    return lines.join('\n');
}

/**
 * Parse Office documents using officeparser (pptx, doc, ppt, odt, ods, odp, rtf, epub)
 */
async function parseWithOfficeParser(buffer: Buffer): Promise<string> {
    const ast = await officeparser.parseOffice(buffer);
    return ast.toText();
}

/**
 * Main function to parse file content
 */
export async function parseFileContent(
    base64: string,
    mimeType: string,
    fileName: string
): Promise<ParseResult> {
    const normalizedMime = mimeType.toLowerCase().trim();

    // 1. Check if it's an image - pass through as input_image
    if (IMAGE_MIME_TYPES.has(normalizedMime) || normalizedMime.startsWith('image/')) {
        return {
            type: 'image',
            dataUri: `data:${mimeType};base64,${base64}`,
        };
    }

    // 2. Check if it's a PDF - pass through as input_file
    if (PASSTHROUGH_FILE_TYPES.has(normalizedMime)) {
        return {
            type: 'file',
            dataUri: `data:${mimeType};base64,${base64}`,
        };
    }

    // 3. Check if it's unsupported (audio, video, archives)
    if (UNSUPPORTED_MIME_TYPES.has(normalizedMime) ||
        normalizedMime.startsWith('audio/') ||
        normalizedMime.startsWith('video/')) {
        return {
            type: 'unsupported',
            error: `File "${fileName}" không hỗ trợ đọc nội dung. Chỉ hỗ trợ images, PDF, documents và code files.`,
        };
    }

    // Decode base64 to buffer
    const buffer = Buffer.from(base64, 'base64');

    // 4. Check if it's a text/code file
    if (isTextMimeType(normalizedMime)) {
        const textContent = buffer.toString('utf-8');
        const language = CODE_LANGUAGE_MAP[normalizedMime];

        // Special handling for Jupyter Notebook
        if (normalizedMime === 'application/x-ipynb+json' || fileName.toLowerCase().endsWith('.ipynb')) {
            try {
                const parsedNotebook = parseIPYNB(textContent);
                return {
                    type: 'text',
                    content: `[File: ${fileName}]\n${parsedNotebook}`,
                    language: 'python',
                };
            } catch {
                // Fall back to raw JSON
            }
        }

        // Format code files with language hint
        if (language) {
            return {
                type: 'text',
                content: `[File: ${fileName}]\n\`\`\`${language}\n${textContent}\n\`\`\``,
                language,
            };
        }

        // Plain text
        return {
            type: 'text',
            content: `[File: ${fileName}]\n${textContent}`,
        };
    }

    // 5. Check if it's an Office document
    const officeType = OFFICE_MIME_TYPES[normalizedMime];
    if (officeType) {
        try {
            let extractedText: string;

            switch (officeType) {
                case 'docx':
                    extractedText = await parseDocx(buffer);
                    break;
                case 'xlsx':
                case 'xls':
                    extractedText = parseExcel(buffer);
                    break;
                case 'doc':
                case 'pptx':
                case 'ppt':
                case 'odt':
                case 'ods':
                case 'odp':
                case 'rtf':
                case 'epub':
                    extractedText = await parseWithOfficeParser(buffer);
                    break;
                default:
                    extractedText = await parseWithOfficeParser(buffer);
            }

            return {
                type: 'text',
                content: `[File: ${fileName}]\n${extractedText}`,
            };
        } catch (error) {
            return {
                type: 'unsupported',
                error: `Không thể đọc file "${fileName}": ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }

    // 6. Try to detect by file extension if MIME type is generic
    const ext = fileName.toLowerCase().split('.').pop();
    if (ext) {
        // Common text extensions
        const textExtensions = ['txt', 'md', 'markdown', 'csv', 'tsv', 'log', 'ini', 'cfg', 'conf'];
        const codeExtensions: Record<string, string> = {
            'js': 'javascript', 'mjs': 'javascript', 'cjs': 'javascript', 'jsx': 'javascript',
            'ts': 'typescript', 'tsx': 'typescript',
            'py': 'python', 'pyw': 'python',
            'java': 'java', 'kt': 'kotlin', 'kts': 'kotlin',
            'c': 'c', 'h': 'c', 'cpp': 'cpp', 'hpp': 'cpp', 'cc': 'cpp', 'cxx': 'cpp',
            'cs': 'csharp', 'fs': 'fsharp',
            'go': 'go', 'rs': 'rust', 'rb': 'ruby', 'php': 'php',
            'swift': 'swift', 'scala': 'scala', 'groovy': 'groovy',
            'sh': 'bash', 'bash': 'bash', 'zsh': 'zsh', 'fish': 'fish',
            'ps1': 'powershell', 'psm1': 'powershell',
            'sql': 'sql', 'r': 'r', 'lua': 'lua', 'pl': 'perl',
            'json': 'json', 'yaml': 'yaml', 'yml': 'yaml', 'toml': 'toml',
            'xml': 'xml', 'html': 'html', 'htm': 'html', 'css': 'css', 'scss': 'scss', 'sass': 'sass', 'less': 'less',
            'vue': 'vue', 'svelte': 'svelte',
        };

        // Check if it's a known text file
        if (textExtensions.includes(ext)) {
            const textContent = buffer.toString('utf-8');
            return {
                type: 'text',
                content: `[File: ${fileName}]\n${textContent}`,
            };
        }

        // Check if it's a known code file
        if (codeExtensions[ext]) {
            const textContent = buffer.toString('utf-8');
            const language = codeExtensions[ext];
            return {
                type: 'text',
                content: `[File: ${fileName}]\n\`\`\`${language}\n${textContent}\n\`\`\``,
                language,
            };
        }

        // Office by extension
        const officeExtensions: Record<string, 'docx' | 'doc' | 'xlsx' | 'xls' | 'pptx' | 'ppt'> = {
            'docx': 'docx', 'doc': 'doc',
            'xlsx': 'xlsx', 'xls': 'xls',
            'pptx': 'pptx', 'ppt': 'ppt',
        };
        if (officeExtensions[ext]) {
            try {
                let extractedText: string;
                const offType = officeExtensions[ext];

                switch (offType) {
                    case 'docx':
                        extractedText = await parseDocx(buffer);
                        break;
                    case 'xlsx':
                    case 'xls':
                        extractedText = parseExcel(buffer);
                        break;
                    default:
                        extractedText = await parseWithOfficeParser(buffer);
                }

                return {
                    type: 'text',
                    content: `[File: ${fileName}]\n${extractedText}`,
                };
            } catch (error) {
                return {
                    type: 'unsupported',
                    error: `Không thể đọc file "${fileName}": ${error instanceof Error ? error.message : 'Unknown error'}`,
                };
            }
        }
    }

    // 7. Unknown file type - try to read as text, fall back to unsupported
    try {
        const textContent = buffer.toString('utf-8');
        // Check if it looks like valid text (no null bytes, mostly printable)
        const nullBytes = textContent.split('\0').length - 1;
        if (nullBytes > 0) {
            return {
                type: 'unsupported',
                error: `File "${fileName}" (${mimeType}) không hỗ trợ đọc nội dung.`,
            };
        }
        return {
            type: 'text',
            content: `[File: ${fileName}]\n${textContent}`,
        };
    } catch {
        return {
            type: 'unsupported',
            error: `File "${fileName}" (${mimeType}) không hỗ trợ đọc nội dung.`,
        };
    }
}
