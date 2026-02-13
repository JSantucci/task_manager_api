import swaggerJSDoc from 'swagger-jsdoc';
import type { Options as SwaggerJSDocOptions } from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';
import v1SwaggerConfig from './v1.0/index.ts';
// import v2SwaggerConfig from "./v2.0/index.ts";

type SwaggerConfig = SwaggerJSDocOptions['definition'];

const swaggerVersions: Record<string, SwaggerConfig> = {
	'1.0': v1SwaggerConfig,
	// "2.0": v2SwaggerConfig,
};

export function setupSwagger(app: Express, latestVersion: string) {
	Object.entries(swaggerVersions).forEach(([version, config]) => {
		const spec = swaggerJSDoc({
			definition: config,
			apis: ['./src/api/**/*.ts'],
		});
		app.use(`/api-docs/v${version}`, swaggerUi.serve, swaggerUi.setup(spec));
	});

	if (swaggerVersions[latestVersion]) {
		const spec = swaggerJSDoc({
			definition: swaggerVersions[latestVersion],
			apis: ['./src/api/**/*.ts'],
		});
		app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));
	}
}
