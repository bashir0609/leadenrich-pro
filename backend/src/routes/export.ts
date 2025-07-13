import { Router } from 'express';
import { z } from 'zod';
import { validate } from '@/utils/validation';
import { ExportService } from '@/services/ExportService';
import fs from 'fs';
import path from 'path';
import { NotFoundError } from '@/types/errors';

const router = Router();

const exportSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'json']),
  columns: z.array(z.string()).optional(),
  includeMetadata: z.boolean().optional(),
});

// Export job results
router.post('/jobs/:jobId', validate(exportSchema), async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const options = req.body;

    // Make sure jobId is defined before passing it to exportJobResults
    if (!jobId) {
      res.status(400).json({
        success: false,
        error: { message: 'Job ID is required' },
      });
      return undefined;
    }

    const result = await ExportService.exportJobResults(jobId, options);

    res.json({
      success: true,
      data: result,
    });
    return undefined;
  } catch (error) {
    next(error);
    return undefined;
  }
});

// Download exported file
router.get('/download/:filename', async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'exports', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        error: { message: 'File not found' },
      });
      return undefined;
    }

    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.csv': 'text/csv',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.json': 'application/json',
    };

    res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream file
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    
    return undefined;
  } catch (error) {
    next(error);
    return undefined;
  }
});

export { router as exportRouter };