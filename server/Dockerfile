FROM php:8.2-apache
RUN a2enmod rewrite

# Install PDO MySQL and other necessary extensions
RUN docker-php-ext-install pdo pdo_mysql

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . /var/www/html/

# Use Composer to install dependencies
RUN composer install --no-dev --optimize-autoloader

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html
EXPOSE 80
