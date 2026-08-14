@echo off
php -d extension=openssl -d extension=mbstring -d extension=pdo_mysql -d extension=mysqli -d extension=curl -d extension=fileinfo "%~dp0artisan" queue:work %*
