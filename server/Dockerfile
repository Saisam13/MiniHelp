FROM php:8.2-apache
RUN a2enmod rewrite

# Install necessary PHP extensions for database and WebPush cryptography
RUN docker-php-ext-install pdo pdo_mysql bcmath


WORKDIR /var/www/html
COPY . /var/www/html/

# Vendor is already included in the repository, no need to run composer install
# (This avoids architecture extension mismatches during Docker build)
# Set proper permissions
RUN chown -R www-data:www-data /var/www/html
EXPOSE 80
