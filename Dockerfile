FROM php:8.4-cli AS application
COPY docker/php-upload.ini /usr/local/etc/php/conf.d/uploads.ini
RUN apt-get update && apt-get install -y --no-install-recommends libpq-dev libzip-dev unzip git \
    && docker-php-ext-install pdo_pgsql zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html
COPY . .
RUN composer install --no-dev --no-interaction --no-progress --prefer-dist --optimize-autoloader \
    && php artisan wayfinder:generate --with-form

FROM node:22-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
COPY --from=application /var/www/html/resources/js/actions ./resources/js/actions
COPY --from=application /var/www/html/resources/js/routes ./resources/js/routes
ENV SKIP_WAYFINDER_GENERATION=true
RUN npm run build

FROM application AS runtime
COPY --from=frontend /app/public/build ./public/build
RUN mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && php artisan storage:link \
    && chown -R www-data:www-data storage bootstrap/cache
EXPOSE 8000
CMD ["sh", "-c", "php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000"]
