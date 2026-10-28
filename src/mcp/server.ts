import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { captureAndAnalyzeSite } from '../index.js';
import { VisualDiffEngine } from '../core/visual-diff.js';
import { TokenCompiler } from '../core/token-compiler.js';
import type { DesignDNA } from '../types/index.js';

export async function startMcpServer() {
  const server = new Server(
    {
      name: 'reweb-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'reweb_extract_dna',
          description:
            'Deeply extracts Design DNA from any live website URL (Awwwards, Stripe, Linear, etc.): computes typography matrix, color roles, materials (shadows, blur, noise), layout grid, and captures high-res screenshots of full page and individual sections (Hero, Bento, Nav, etc.) along with compiled Tailwind/globals.css tokens.',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'The target website URL to reverse-engineer and clone.',
              },
              outputDir: {
                type: 'string',
                description: 'Optional custom directory path to save screenshots and tokens.',
              },
            },
            required: ['url'],
          },
        },
        {
          name: 'reweb_visual_diff',
          description:
            'Performs a pixel-by-pixel visual comparison between a reference screenshot and a generated candidate build, producing an annotated diff image and mismatch score.',
          inputSchema: {
            type: 'object',
            properties: {
              referenceImagePath: {
                type: 'string',
                description: 'Absolute path to the reference screenshot.',
              },
              candidateImagePath: {
                type: 'string',
                description: 'Absolute path to the candidate screenshot.',
              },
              diffOutputPath: {
                type: 'string',
                description: 'Path where the visual diff PNG should be written.',
              },
            },
            required: ['referenceImagePath', 'candidateImagePath'],
          },
        },
        {
          name: 'reweb_compile_tokens',
          description:
            'Compiles raw DesignDNA JSON into ready-to-use globals.css, tailwind.config.ts, and Google Font links.',
          inputSchema: {
            type: 'object',
            properties: {
              dna: {
                type: 'object',
                description: 'DesignDNA JSON object.',
              },
            },
            required: ['dna'],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'reweb_extract_dna') {
      const url = String(args?.url);
      const outputDir = args?.outputDir ? String(args.outputDir) : undefined;
      const res = await captureAndAnalyzeSite(url, outputDir);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                summary: `Successfully extracted Design DNA from ${url}`,
                siteTitle: res.dna.title,
                primaryFont: res.dna.typography.primaryFont,
                editorialFont: res.dna.typography.editorialFont,
                baseBackground: res.dna.palette.backgrounds[0],
                surfaceCard: res.dna.palette.surfaces[0],
                detectedSections: res.dna.sections.map((s) => ({
                  id: s.id,
                  role: s.role,
                  headline: s.headline,
                  screenshotPath: s.desktopScreenshot,
                })),
                fullScreenshotDesktop: res.dna.fullScreenshot.desktop,
                fullScreenshotMobile: res.dna.fullScreenshot.mobile,
                outputDir: res.outputDir,
                dna: res.dna,
                compiledTokens: res.compiled,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === 'reweb_visual_diff') {
      const ref = String(args?.referenceImagePath);
      const cand = String(args?.candidateImagePath);
      const out = args?.diffOutputPath ? String(args.diffOutputPath) : 'diff.png';
      const engine = new VisualDiffEngine();
      const diffRes = await engine.compare(ref, cand, out);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(diffRes, null, 2),
          },
        ],
      };
    }

    if (name === 'reweb_compile_tokens') {
      const dna = args?.dna as DesignDNA;
      const compiler = new TokenCompiler();
      const compiled = compiler.compile(dna);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(compiled, null, 2),
          },
        ],
      };
    }

    throw new Error(`Tool not found: ${name}`);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  startMcpServer().catch((err) => {
    console.error('Failed to start ReWeb MCP Server:', err);
    process.exit(1);
  });
}
