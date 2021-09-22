import Ajv from 'ajv';
import ajvKeywords from 'ajv-keywords';
const ajv = new Ajv({ allErrors: true, removeAdditional: true });
ajvKeywords(ajv, ['transform']);
export const validator = ajv;
