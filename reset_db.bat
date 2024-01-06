@echo off

call sequelize db:drop
if not %errorlevel% == 0 goto error

call sequelize db:create
if not %errorlevel% == 0 goto error

call sequelize db:migrate
if not %errorlevel% == 0 goto error

call sequelize db:seed:all
if not %errorlevel% == 0 goto error

echo All Sequelize commands completed successfully.
goto end

:error
echo Error encountered during Sequelize command execution.

:end
