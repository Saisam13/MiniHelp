FROM php:8.2-apache
RUN a2enmod rewrite

# Install necessary system packages and PHP extensions
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libgmp-dev \
    && docker-php-ext-install pdo pdo_mysql zip bcmath gmp

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . /var/www/html/

# Use Composer to install dependencies safely
RUN composer install --no-dev --optimize-autoloader --ignore-platform-reqs

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html
EXPOSE 80
