# The API only. This image used to carry a second, Node stage that compiled
# the Vite bundle into public/build and a final stage that copied it across —
# there is no bundle here any more. The site is built from ../frontend and
# deployed to Vercel, so this image has no Node in it and serves no HTML.
FROM php:8.4-cli

COPY docker/php-upload.ini /usr/local/etc/php/conf.d/uploads.ini

RUN apt-get update && apt-get install -y --no-install-recommends libpq-dev libzip-dev unzip git \
    && docker-php-ext-install pdo_pgsql zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

RUN composer install --no-dev --no-interaction --no-progress --prefer-dist --optimize-autoloader

# storage:link is what makes the office's uploaded posters reachable at
# /storage/..., which is the URL the API hands the front end.
RUN mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && php artisan storage:link \
    && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 8000
CMD ["sh", "-c", "php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000"]
