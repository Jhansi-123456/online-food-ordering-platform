pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = 'online-food-ordering-platform'
        IMAGE_TAG = "build-${BUILD_NUMBER}"
        TEST_CUSTOMER = 'Jenkins Test'
        TEST_FOOD = 'Burger'
        TEST_QUANTITY = '2'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out source code from GitHub...'

                git branch: 'main',
                    url: 'https://github.com/Jhansi-123456/online-food-ordering-platform.git'
            }
        }

        stage('Create Environment Configuration') {
            steps {
                echo 'Creating Jenkins environment configuration...'

                bat '''
                    (
                        echo POSTGRES_DB=food_orders
                        echo POSTGRES_USER=fooduser
                        echo POSTGRES_PASSWORD=foodpassword
                        echo DB_HOST=db
                        echo DB_PORT=5432
                        echo DB_NAME=food_orders
                        echo DB_USER=fooduser
                        echo DB_PASSWORD=foodpassword
                        echo APP_PORT=3000
                        echo IMAGE_TAG=%IMAGE_TAG%
                    ) > .env
                '''
            }
        }

        stage('Docker Build') {
            steps {
                echo "Building Order API Docker image: %IMAGE_TAG%"

                bat 'docker compose build order-api'
            }
        }

        stage('Start Environment') {
            steps {
                echo 'Starting PostgreSQL, Order API and Nginx...'

                bat 'docker compose up -d'
            }
        }

        stage('Wait for Services') {
            steps {
                echo 'Waiting for the application to become ready...'

                bat '''
                    set RETRIES=12

                    :check
                    curl.exe --fail http://localhost:8082/health >nul 2>&1

                    if %ERRORLEVEL% EQU 0 (
                        echo Application is ready.
                        goto done
                    )

                    set /a RETRIES=%RETRIES%-1

                    if %RETRIES% LEQ 0 (
                        echo Application did not become ready.
                        exit /b 1
                    )

                    echo Waiting for application...
                    timeout /t 5 /nobreak >nul
                    goto check

                    :done
                '''
            }
        }

        stage('Nginx Health Verification') {
            steps {
                echo 'Testing the application through Nginx...'

                bat '''
                    curl.exe --fail http://localhost:8082/health
                '''
            }
        }

        stage('Create Test Order') {
            steps {
                echo 'Creating a test food order through Nginx...'

                bat '''
                    curl.exe --fail -X POST http://localhost:8082/orders ^
                      -H "Content-Type: application/json" ^
                      -d "{\\"customer_name\\":\\"%TEST_CUSTOMER%\\",\\"food_item\\":\\"%TEST_FOOD%\\",\\"quantity\\":%TEST_QUANTITY%}" ^
                      -o created-order.json

                    echo Created order:
                    type created-order.json
                '''
            }
        }

        stage('Retrieve Order') {
            steps {
                echo 'Retrieving existing orders through Nginx...'

                bat '''
                    curl.exe --fail http://localhost:8082/orders -o orders.json

                    echo Existing orders:
                    type orders.json
                '''
            }
        }

        stage('Verify Database') {
            steps {
                echo 'Verifying that PostgreSQL contains the Jenkins test order...'

                bat '''
                    docker compose exec -T db psql -U fooduser -d food_orders -tAc "SELECT COUNT(*) FROM orders WHERE customer_name='Jenkins Test' AND food_item='Burger' AND quantity=2;" > db-check.txt

                    set /p COUNT=<db-check.txt

                    echo Matching orders found: %COUNT%

                    if "%COUNT%"=="0" (
                        echo ERROR: Jenkins test order was not found in PostgreSQL.
                        exit /b 1
                    )

                    echo Database verification successful.
                '''
            }
        }
    }

    post {

        failure {
            echo 'Pipeline failed. Displaying Docker Compose status and logs...'

            bat '''
                docker compose ps
                docker compose logs --tail=100
            '''
        }

        always {
            echo 'Stopping application containers while preserving PostgreSQL volume...'

            bat '''
                docker compose down
            '''
        }
    }
}