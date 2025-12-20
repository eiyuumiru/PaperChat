/**
 * IPYNB Parser - Parse Jupyter Notebook files to text
 * .ipynb files are JSON containing cells (code, markdown, raw)
 */

/**
 * Jupyter Notebook cell types
 */
interface NotebookCell {
    cell_type: 'code' | 'markdown' | 'raw';
    source: string | string[];
    outputs?: NotebookOutput[];
    execution_count?: number | null;
}

/**
 * Notebook output types
 */
interface NotebookOutput {
    output_type: string;
    text?: string | string[];
    data?: Record<string, string | string[]>;
    name?: string;
    ename?: string;
    evalue?: string;
    traceback?: string[];
}

/**
 * Jupyter Notebook structure
 */
interface NotebookContent {
    cells: NotebookCell[];
    metadata?: {
        kernelspec?: {
            display_name?: string;
            language?: string;
            name?: string;
        };
        language_info?: {
            name?: string;
            version?: string;
        };
    };
    nbformat?: number;
    nbformat_minor?: number;
}

/**
 * IPYNB Parser utility class
 */
export class IPYNBParser {
    /**
     * Check if a file is an IPYNB file
     */
    static isIPYNB(file: File): boolean {
        return (
            file.name.toLowerCase().endsWith('.ipynb') ||
            file.type === 'application/x-ipynb+json' ||
            file.type === 'application/json'
        );
    }

    /**
     * Check if file extension is .ipynb
     */
    static hasIPYNBExtension(fileName: string): boolean {
        return fileName.toLowerCase().endsWith('.ipynb');
    }

    /**
     * Read file as text
     */
    static readAsText(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * Normalize cell source (can be string or array of strings)
     */
    private static normalizeSource(source: string | string[]): string {
        if (Array.isArray(source)) {
            return source.join('');
        }
        return source;
    }

    /**
     * Extract text from output
     */
    private static extractOutputText(output: NotebookOutput): string {
        const lines: string[] = [];

        if (output.output_type === 'stream' && output.text) {
            lines.push(this.normalizeSource(output.text));
        } else if (output.output_type === 'execute_result' || output.output_type === 'display_data') {
            if (output.data) {
                // Prefer text/plain for readability
                if (output.data['text/plain']) {
                    lines.push(this.normalizeSource(output.data['text/plain']));
                }
            }
        } else if (output.output_type === 'error') {
            if (output.ename && output.evalue) {
                lines.push(`Error: ${output.ename}: ${output.evalue}`);
            }
            if (output.traceback) {
                // Clean ANSI codes from traceback
                const cleanTraceback = output.traceback
                    .join('\n')
                    .replace(/\x1b\[[0-9;]*m/g, '');
                lines.push(cleanTraceback);
            }
        }

        return lines.join('');
    }

    /**
     * Parse IPYNB file content to readable text
     */
    static parse(jsonContent: string): string {
        try {
            const notebook: NotebookContent = JSON.parse(jsonContent);
            const lines: string[] = [];

            // Add notebook metadata header
            const language = notebook.metadata?.language_info?.name ||
                notebook.metadata?.kernelspec?.language ||
                'python';
            lines.push(`# Jupyter Notebook (${language})`);
            lines.push('');

            // Process each cell
            notebook.cells.forEach((cell, index) => {
                const cellNum = index + 1;
                const source = this.normalizeSource(cell.source);

                if (cell.cell_type === 'markdown') {
                    lines.push(`## [Markdown Cell ${cellNum}]`);
                    lines.push(source);
                    lines.push('');
                } else if (cell.cell_type === 'code') {
                    const execCount = cell.execution_count !== null && cell.execution_count !== undefined
                        ? ` [${cell.execution_count}]`
                        : '';
                    lines.push(`## [Code Cell ${cellNum}]${execCount}`);
                    lines.push('```' + language);
                    lines.push(source);
                    lines.push('```');

                    // Include outputs if present
                    if (cell.outputs && cell.outputs.length > 0) {
                        lines.push('');
                        lines.push('**Output:**');
                        lines.push('```');
                        for (const output of cell.outputs) {
                            const outputText = this.extractOutputText(output);
                            if (outputText.trim()) {
                                lines.push(outputText);
                            }
                        }
                        lines.push('```');
                    }
                    lines.push('');
                } else if (cell.cell_type === 'raw') {
                    lines.push(`## [Raw Cell ${cellNum}]`);
                    lines.push('```');
                    lines.push(source);
                    lines.push('```');
                    lines.push('');
                }
            });

            return lines.join('\n');
        } catch (error) {
            throw new Error(`Failed to parse IPYNB file: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
        }
    }

    /**
     * Parse IPYNB file to text
     */
    static async parseFile(file: File): Promise<string> {
        const content = await this.readAsText(file);
        return this.parse(content);
    }
}
