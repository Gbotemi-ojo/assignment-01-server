import app from './app';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`API health: http://localhost:${PORT}/api/health`);
  console.log(`API inspections: http://localhost:${PORT}/api/inspections`);
});
