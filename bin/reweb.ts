#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import readline from 'readline/promises';
import { captureAndAnalyzeSite } from '../src/index.js';
import { readVersion } from '../src/version.js';
import { VisualDiffEngine } from '../src/core/visual-diff.js';
import { ProviderIntegrator } from '../src/integrations/setup.js';

const program = new Command();

async function runExtraction(targetUrl: string, outputDir?: string) {
  let url = targetUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  console.log(chalk.bold.magenta('\n✦ [ReWeb] Starting Deep Design Extraction...'));
  console.log(chalk.cyan(`Target: ${url}\n`));

  const startTime = Date.now();
  try {
    const result = await captureAndAnalyzeSite(url, outputDir);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(chalk.green(`✔ Extraction complete in ${elapsed}s!\n`));
    console.log(chalk.bold('Design DNA Summary:'));
    console.log(`• Site Title:        ${chalk.white(result.dna.title)}`);
    console.log(`• Primary Font:      ${chalk.yellow(result.dna.typography.primaryFont)}`);
    if (result.dna.typography.editorialFont) {
      console.log(`• Editorial Serif:   ${chalk.yellow(result.dna.typography.editorialFont)}`);
    }
    console.log(`• Canvas Background: ${chalk.cyan(result.dna.palette.backgrounds[0] || 'Unknown')}`);
    console.log(`• Surface Card:      ${chalk.cyan(result.dna.palette.surfaces[0] || 'Unknown')}`);
    console.log(`• Border Tone:       ${chalk.cyan(result.dna.palette.borders[0] || 'Unknown')}`);
    console.log(`• Sections Detected: ${chalk.magenta(result.dna.sections.length)}`);

    console.log(chalk.bold('\nCaptured Sections:'));
    for (const sec of result.dna.sections) {
      console.log(`  - [${chalk.yellow(sec.role)}] ${sec.headline || sec.id} (${chalk.dim(sec.bounds.width + 'x' + sec.bounds.height)})`);
    }

    console.log(chalk.bold('\nGenerated Files:'));
    console.log(`• Output Folder:     ${chalk.underline(result.outputDir)}`);
    console.log(`• Design DNA:        ${path.join(result.outputDir, 'dna.json')}`);
    console.log(`• Tailwind Config:   ${path.join(result.outputDir, 'tailwind.config.ts')}`);
    console.log(`• Globals CSS:       ${path.join(result.outputDir, 'globals.css')}`);
    console.log(`• Desktop Full Shot: ${result.dna.fullScreenshot.desktop}`);
    console.log(`• Mobile Full Shot:  ${result.dna.fullScreenshot.mobile}\n`);
  } catch (err: any) {
    console.error(chalk.red(`\n✖ Error extracting design: ${err.message}`));
    process.exit(1);
  }
}

program
  .name('reweb')
  .description('✦ ReWeb: Instant 1-to-1 Design Transmutation Engine')
  .version(readVersion())
  .argument('[url]', 'Website URL to clone (e.g. reweb linear.app)')
  .option('-o, --output <dir>', 'Custom output directory')
  .action(async (url?: string, options?: { output?: string }) => {
    if (url) {
      await runExtraction(url, options?.output);
      return;
    }

    // Interactive prompt if no arguments passed!
    console.log(chalk.bold.magenta('\n✦ [ReWeb] Design Transmutation Engine'));
    console.log(chalk.dim('Clone any Awwwards/website aesthetic into clean tokens in seconds.\n'));

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      const inputUrl = await rl.question(chalk.yellow('? Enter website URL to clone: '));
      if (!inputUrl || inputUrl.trim().length === 0) {
        console.log(chalk.dim('No URL entered. Exiting.'));
        process.exit(0);
      }
      await runExtraction(inputUrl, options?.output);
    } finally {
      rl.close();
    }
  });

program
  .command('setup [provider]')
  .description('One-click setup for AI providers: opencode, claude, cursor, windsurf, or all')
  .action(async (provider?: string) => {
    console.log(chalk.bold.magenta('\n✦ [ReWeb] AI Provider MCP Setup\n'));
    const integrator = new ProviderIntegrator();

    const target = (provider || 'all').toLowerCase();
    let results: any[] = [];

    if (target === 'opencode' || target === 'open-code') {
      results = [integrator.setupOpenCode(true)];
    } else if (target === 'claude' || target === 'claude-code') {
      results = [integrator.setupClaudeCode()];
    } else if (target === 'cursor') {
      results = [integrator.setupCursor()];
    } else if (target === 'windsurf') {
      results = [integrator.setupWindsurf()];
    } else if (target === 'all') {
      results = integrator.setupAll();
    } else {
      console.log(chalk.red(`Unknown provider: "${provider}". Use: opencode, claude, cursor, windsurf, or all.`));
      process.exit(1);
    }

    for (const res of results) {
      if (res.success) {
        console.log(`  ${chalk.green('✔')} ${chalk.bold(res.provider)}: ${res.message}`);
        if (res.configPath) console.log(`    ${chalk.dim(res.configPath)}`);
      } else {
        console.log(`  ${chalk.red('✖')} ${chalk.bold(res.provider)}: ${res.message}`);
      }
    }

    console.log(chalk.bold.green('\n🎉 Setup complete! You can now use ReWeb inside your AI coding agents.\n'));
  });

program
  .command('diff <ref> <cand>')
  .description('Run visual pixel diff between reference screenshot and candidate build')
  .option('-d, --out <file>', 'Diff image output path', 'diff.png')
  .action(async (ref: string, cand: string, options: { out: string }) => {
    console.log(chalk.bold.magenta('\n✦ [ReWeb] Running Visual Pixel Diff...'));
    const engine = new VisualDiffEngine();
    try {
      const res = await engine.compare(ref, cand, options.out);
      console.log(`• Mismatch Pixels:     ${chalk.yellow(res.mismatchPixels)} / ${res.totalPixels}`);
      console.log(`• Mismatch Delta:      ${res.isMatch ? chalk.green(`${res.mismatchPercentage}%`) : chalk.red(`${res.mismatchPercentage}%`)}`);
      console.log(`• Diff Image Saved To: ${chalk.underline(res.diffImagePath)}`);
      for (const note of res.notes) {
        console.log(`  ✦ ${note}`);
      }
    } catch (err: any) {
      console.error(chalk.red(`\n✖ Error running diff: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('doctor')
  .description('Check the environment: node version, chromium browser, MCP readiness')
  .action(async () => {
    console.log(chalk.bold.magenta('\n✦ [ReWeb] Doctor\n'));
    let ok = true;

    // node version
    const major = Number(process.versions.node.split('.')[0]);
    if (major >= 20) {
      console.log(`  ${chalk.green('✔')} node ${process.versions.node}`);
    } else {
      ok = false;
      console.log(`  ${chalk.red('✖')} node ${process.versions.node} — reweb needs node >= 20`);
    }

    // chromium
    let chromiumOk = false;
    try {
      const { chromium: c } = await import('playwright-core');
      const b = await c.launch({ headless: true });
      await b.close().catch(() => {});
      chromiumOk = true;
    } catch {
      chromiumOk = false;
    }
    if (chromiumOk) {
      console.log(`  ${chalk.green('✔')} chromium headless shell — ready`);
    } else {
      console.log(`  ${chalk.yellow('!')} chromium is not installed.`);
      console.log(`    Run:  ${chalk.cyan('npx playwright install chromium --only-shell')}`);
      console.log(`    (or:  ${chalk.cyan('npm i -g @playwright/browser-chromium')})`);
    }

    // node_modules sanity for the MCP deps
    try {
      await import('@modelcontextprotocol/sdk/server/index.js');
      console.log(`  ${chalk.green('✔')} mcp sdk — ready`);
    } catch {
      ok = false;
      console.log(`  ${chalk.red('✖')} @modelcontextprotocol/sdk missing — reinstall: npm i -g reweb-mcp`);
    }

    console.log('');
    if (ok && chromiumOk) {
      console.log(chalk.bold.green('  All green. Add the MCP server: reweb setup all\n'));
    } else if (ok) {
      console.log(chalk.bold.yellow('  Install chromium, then: reweb setup all\n'));
    } else {
      console.log(chalk.bold.red('  Fix the issues above, then: reweb setup all\n'));
      process.exitCode = 1;
    }
  });

program
  .command('mcp')
  .description('Run the ReWeb MCP Server on stdio')
  .action(async () => {
    const { startMcpServer } = await import('../src/mcp/server.js');
    await startMcpServer();
  });

program.parse(process.argv);
