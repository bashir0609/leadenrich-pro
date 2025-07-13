import { Router } from 'express';
import { upload } from '@/middleware/upload';
import { FileProcessingService } from '@/services/FileProcessingService';
import { logger } from '@/utils/logger';

const router = Router();

// Upload and parse CSV
router.post('/csv', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { message: 'No file uploaded' },
      });
      return;
    }

    logger.info(`Processing uploaded file: ${req.file.filename}`);
    
    // Parse CSV
    const parsedData = await FileProcessingService.parseCSV(req.file.path);
    
    // Detect column types
    const columnTypes = await FileProcessingService.detectColumnTypes(parsedData);
    
    // Suggest mappings (example target fields)
    const targetFields = ['email', 'firstName', 'lastName', 'company', 'domain', 'phone'];
    const suggestions = FileProcessingService.suggestColumnMapping(
      parsedData.headers,
      columnTypes,
      targetFields
    );
    
    // Clean up file after parsing
    await FileProcessingService.cleanupFile(req.file.path);
    
    res.json({
      success: true,
      data: {
        headers: parsedData.headers,
        totalRows: parsedData.totalRows,
        preview: parsedData.preview,
        columnTypes,
        suggestions,
      },
    });
  } catch (error) {
    // Clean up file on error
    if (req.file) {
      await FileProcessingService.cleanupFile(req.file.path);
    }
    next(error);
  }
});

export { router as uploadRouter };