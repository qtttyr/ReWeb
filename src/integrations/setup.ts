import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ProviderResult {
  provider: string;
  success: boolean;
  message: string;
  configPath?: string;
}

export class ProviderIntegrator {
  private serverPath: string;

  constructor() {
    this.serverPath = path.resolve(__dirname, '../../dist/src/mcp/server.js');
    if (!fs.existsSync(this.serverPath)) {
      // Fallback if running via tsx or before build
      this.serverPath = path.resolve(process.cwd(), 'dist/src/mcp/server.js');
    }
  }

  // 1. OpenCode 2.0 Adapter
  setupOpenCode(isGlobal = true): ProviderResult {
    const configDir = isGlobal
      ? path.join(os.homedir(), '.config', 'opencode')
      : path.join(process.cwd());
    const configFile = path.join(configDir, 'opencode.json');

    try {
      fs.mkdirSync(configDir, { recursive: true });

      let config: any = {
        $schema: 'https://opencode.ai/config.json',
        mcp: { servers: {} },
      };

      if (fs.existsSync(configFile)) {
        try {
          const content = fs.readFileSync(configFile, 'utf-8');
          config = JSON.parse(content);
        } catch {
          // preserve basic structure if unreadable
        }
      }

      if (!config.mcp) config.mcp = {};
      if (!config.mcp.servers) config.mcp.servers = {};

      config.mcp.servers['reweb'] = {
        type: 'local',
        command: ['node', this.serverPath],
      };

      fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');

      return {
        provider: 'OpenCode 2.0',
        success: true,
        message: `Registered ReWeb MCP in OpenCode (${isGlobal ? 'Global' : 'Project'})`,
        configPath: configFile,
      };
    } catch (err: any) {
      return {
        provider: 'OpenCode 2.0',
        success: false,
        message: `Failed: ${err.message}`,
      };
    }
  }

  // 2. Claude Code Adapter
  setupClaudeCode(): ProviderResult {
    try {
      // First try using the official claude CLI if installed
      try {
        execSync(`claude mcp add reweb -- node "${this.serverPath}"`, {
          stdio: 'ignore',
        });
        return {
          provider: 'Claude Code',
          success: true,
          message: 'Registered ReWeb MCP via `claude mcp add`',
        };
      } catch {
        // Fallback: manually update ~/.claude.json or project .mcp.json
        const claudeJsonPath = path.join(os.homedir(), '.claude.json');
        let config: any = {};
        if (fs.existsSync(claudeJsonPath)) {
          try {
            config = JSON.parse(fs.readFileSync(claudeJsonPath, 'utf-8'));
          } catch {}
        }
        if (!config.mcpServers) config.mcpServers = {};
        config.mcpServers['reweb'] = {
          command: 'node',
          args: [this.serverPath],
        };
        fs.writeFileSync(claudeJsonPath, JSON.stringify(config, null, 2), 'utf-8');

        // Also create project-level .mcp.json for portability
        const projectMcp = path.join(process.cwd(), '.mcp.json');
        let projConfig: any = { mcpServers: {} };
        if (fs.existsSync(projectMcp)) {
          try {
            projConfig = JSON.parse(fs.readFileSync(projectMcp, 'utf-8'));
          } catch {}
        }
        if (!projConfig.mcpServers) projConfig.mcpServers = {};
        projConfig.mcpServers['reweb'] = {
          command: 'node',
          args: [this.serverPath],
        };
        fs.writeFileSync(projectMcp, JSON.stringify(projConfig, null, 2), 'utf-8');

        return {
          provider: 'Claude Code',
          success: true,
          message: 'Saved to ~/.claude.json and project .mcp.json',
          configPath: claudeJsonPath,
        };
      }
    } catch (err: any) {
      return {
        provider: 'Claude Code',
        success: false,
        message: `Failed: ${err.message}`,
      };
    }
  }

  // 3. Cursor Adapter
  setupCursor(): ProviderResult {
    const cursorDir = path.join(os.homedir(), '.cursor');
    const cursorFile = path.join(cursorDir, 'mcp.json');
    const projectCursor = path.join(process.cwd(), '.cursor', 'mcp.json');

    try {
      fs.mkdirSync(cursorDir, { recursive: true });
      fs.mkdirSync(path.join(process.cwd(), '.cursor'), { recursive: true });

      const entry = {
        command: 'node',
        args: [this.serverPath],
      };

      for (const file of [cursorFile, projectCursor]) {
        let config: any = { mcpServers: {} };
        if (fs.existsSync(file)) {
          try {
            config = JSON.parse(fs.readFileSync(file, 'utf-8'));
          } catch {}
        }
        if (!config.mcpServers) config.mcpServers = {};
        config.mcpServers['reweb'] = entry;
        fs.writeFileSync(file, JSON.stringify(config, null, 2), 'utf-8');
      }

      return {
        provider: 'Cursor',
        success: true,
        message: 'Registered in ~/.cursor/mcp.json and .cursor/mcp.json',
        configPath: cursorFile,
      };
    } catch (err: any) {
      return {
        provider: 'Cursor',
        success: false,
        message: `Failed: ${err.message}`,
      };
    }
  }

  // 4. Windsurf Adapter
  setupWindsurf(): ProviderResult {
    const windsurfDir = path.join(os.homedir(), '.codeium', 'windsurf');
    const windsurfFile = path.join(windsurfDir, 'mcp_config.json');

    try {
      fs.mkdirSync(windsurfDir, { recursive: true });
      let config: any = { mcpServers: {} };
      if (fs.existsSync(windsurfFile)) {
        try {
          config = JSON.parse(fs.readFileSync(windsurfFile, 'utf-8'));
        } catch {}
      }
      if (!config.mcpServers) config.mcpServers = {};
      config.mcpServers['reweb'] = {
        command: 'node',
        args: [this.serverPath],
      };
      fs.writeFileSync(windsurfFile, JSON.stringify(config, null, 2), 'utf-8');

      return {
        provider: 'Windsurf',
        success: true,
        message: 'Registered in ~/.codeium/windsurf/mcp_config.json',
        configPath: windsurfFile,
      };
    } catch (err: any) {
      return {
        provider: 'Windsurf',
        success: false,
        message: `Failed: ${err.message}`,
      };
    }
  }

  // 5. VS Code (Cline / Roo-Code) Adapter
  setupCline(): ProviderResult {
    const isMac = process.platform === 'darwin';
    const clineDir = isMac
      ? path.join(
          os.homedir(),
          'Library',
          'Application Support',
          'Code',
          'User',
          'globalStorage',
          'rooveterinaryinc.roo-cline',
          'settings'
        )
      : path.join(os.homedir(), '.config', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings');
    const clineFile = path.join(clineDir, 'cline_mcp_settings.json');

    try {
      if (fs.existsSync(path.dirname(clineDir))) {
        fs.mkdirSync(clineDir, { recursive: true });
        let config: any = { mcpServers: {} };
        if (fs.existsSync(clineFile)) {
          try {
            config = JSON.parse(fs.readFileSync(clineFile, 'utf-8'));
          } catch {}
        }
        if (!config.mcpServers) config.mcpServers = {};
        config.mcpServers['reweb'] = {
          command: 'node',
          args: [this.serverPath],
        };
        fs.writeFileSync(clineFile, JSON.stringify(config, null, 2), 'utf-8');

        return {
          provider: 'Cline / Roo Code',
          success: true,
          message: 'Registered in cline_mcp_settings.json',
          configPath: clineFile,
        };
      }
      return {
        provider: 'Cline / Roo Code',
        success: true,
        message: 'Cline not active on this machine (skipped)',
      };
    } catch (err: any) {
      return {
        provider: 'Cline / Roo Code',
        success: false,
        message: `Failed: ${err.message}`,
      };
    }
  }

  // Setup All Providers
  setupAll(): ProviderResult[] {
    return [
      this.setupOpenCode(true),
      this.setupClaudeCode(),
      this.setupCursor(),
      this.setupWindsurf(),
      this.setupCline(),
    ];
  }
}
