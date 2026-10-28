import fs from 'fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import path from 'path';

export interface VisualDiffResult {
  mismatchPixels: number;
  totalPixels: number;
  mismatchPercentage: number;
  diffImagePath: string;
  isMatch: boolean;
  notes: string[];
}

export class VisualDiffEngine {
  async compare(
    referencePath: string,
    candidatePath: string,
    outputPath: string,
    threshold = 0.1
  ): Promise<VisualDiffResult> {
    const refData = fs.readFileSync(referencePath);
    const candData = fs.readFileSync(candidatePath);

    const refPng = PNG.sync.read(refData);
    const candPng = PNG.sync.read(candData);

    const width = Math.min(refPng.width, candPng.width);
    const height = Math.min(refPng.height, candPng.height);

    // pixelmatch requires equal-size buffers: crop both to the common area
    const crop = (src: PNG): Buffer => {
      const out = new PNG({ width, height });
      for (let y = 0; y < height; y++) {
        const srcStart = (y * src.width) * 4;
        const dstStart = (y * width) * 4;
        src.data.copy(out.data, dstStart, srcStart, srcStart + width * 4);
      }
      return out.data;
    };

    // Create diff canvas
    const diff = new PNG({ width, height });

    const mismatchPixels = pixelmatch(
      crop(refPng),
      crop(candPng),
      diff.data,
      width,
      height,
      {
        threshold,
        includeAA: false,
        diffColor: [255, 0, 128], // hot magenta highlight
      }
    );

    const totalPixels = width * height;
    const mismatchPercentage = parseFloat(((mismatchPixels / totalPixels) * 100).toFixed(2));

    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, PNG.sync.write(diff));

    const notes: string[] = [];
    if (refPng.width !== candPng.width || refPng.height !== candPng.height) {
      notes.push(
        `Dimension delta: Ref is ${refPng.width}x${refPng.height}, candidate is ${candPng.width}x${candPng.height}`
      );
    }

    if (mismatchPercentage < 3.0) {
      notes.push('Elite Fidelity: Less than 3% visual variance! Near 1:1 match.');
    } else if (mismatchPercentage < 10.0) {
      notes.push('Acceptable High Fidelity: 3-10% variance, mostly copy/asset differences.');
    } else {
      notes.push('Noticeable styling drift: Layout spacing, font weight, or background contrast needs tuning.');
    }

    return {
      mismatchPixels,
      totalPixels,
      mismatchPercentage,
      diffImagePath: outputPath,
      isMatch: mismatchPercentage < 5.0,
      notes,
    };
  }
}
