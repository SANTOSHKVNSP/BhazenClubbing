import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname, 'Meeta_HTML/Meeta/assets/images');
const outputDir = path.join(__dirname, 'Meeta_HTML/Meeta/assets/images-optimized');

async function optimizeImages() {
  console.log('🚀 Starting image optimization...\n');

  // Create output directories
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const webpDir = path.join(outputDir, 'webp');
  if (!fs.existsSync(webpDir)) {
    fs.mkdirSync(webpDir, { recursive: true });
  }

  // Get all image files
  const files = fs.readdirSync(inputDir).filter(file =>
    /\.(jpg|jpeg|png)$/i.test(file)
  );

  console.log(`📦 Found ${files.length} images to optimize\n`);

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let totalWebpSize = 0;

  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const ext = path.extname(file).toLowerCase();
    const baseName = path.basename(file, ext);

    const originalSize = fs.statSync(inputPath).size;
    totalOriginalSize += originalSize;

    try {
      // Optimize and convert to appropriate format
      if (ext === '.png') {
        // PNG optimization
        const outputPath = path.join(outputDir, file);
        await sharp(inputPath)
          .png({ quality: 80, compressionLevel: 9 })
          .toFile(outputPath);

        const optimizedSize = fs.statSync(outputPath).size;
        totalOptimizedSize += optimizedSize;
        const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
        console.log(`  ✓ ${file}: ${formatBytes(originalSize)} → ${formatBytes(optimizedSize)} (${savings}% saved)`);
      } else {
        // JPEG optimization
        const outputPath = path.join(outputDir, baseName + '.jpg');
        await sharp(inputPath)
          .jpeg({ quality: 80, progressive: true })
          .toFile(outputPath);

        const optimizedSize = fs.statSync(outputPath).size;
        totalOptimizedSize += optimizedSize;
        const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
        console.log(`  ✓ ${file}: ${formatBytes(originalSize)} → ${formatBytes(optimizedSize)} (${savings}% saved)`);
      }

      // Create WebP version
      const webpPath = path.join(webpDir, baseName + '.webp');
      await sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(webpPath);

      const webpSize = fs.statSync(webpPath).size;
      totalWebpSize += webpSize;

    } catch (error) {
      console.error(`  ✗ Error processing ${file}:`, error.message);
    }
  }

  console.log('\n📊 Optimization Summary:');
  console.log(`  Original total: ${formatBytes(totalOriginalSize)}`);
  console.log(`  Optimized total: ${formatBytes(totalOptimizedSize)}`);
  console.log(`  WebP total: ${formatBytes(totalWebpSize)}`);
  console.log(`  Total savings: ${formatBytes(totalOriginalSize - totalOptimizedSize)} (${((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1)}%)`);
  console.log(`  WebP savings: ${formatBytes(totalOriginalSize - totalWebpSize)} (${((totalOriginalSize - totalWebpSize) / totalOriginalSize * 100).toFixed(1)}%)`);
  console.log(`\n🎉 Image optimization complete!`);
  console.log(`📁 Optimized images: ${outputDir}`);
  console.log(`📁 WebP images: ${webpDir}`);
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

optimizeImages().catch(err => {
  console.error('❌ Error optimizing images:', err);
  process.exit(1);
});
