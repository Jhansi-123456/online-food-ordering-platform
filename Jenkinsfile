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
                    url: 'https://github.com/Jhansi-123456/Online-Food-Ordering-Platform.git'
            }
        }

        stage('Create Environment Configuration') {
            steps {
                echo 'Creating .env configuration for Jenkins...'

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
                echo 'Starting the complete Docker Compose environment...'

                bat 'docker compose up -d'
            }
        }

        stage('Wait for Services') {
            steps {
                echo 'Waiting for PostgreSQL and Order API to become available...'

                bat '''
                    timeout /t 10 /nobreak
                    docker compose ps
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

                    type created-order.json
                '''
            }
        }

        stage('Retrieve Order') {
            steps {
                echo 'Retrieving existing orders through Nginx...'

                bat '''
                    curl.exe --fail http://localhost:8082/orders -o orders.json
                    type orders.json
                '''
            }
        }

        stage('Verify Database') {
            steps {
                echo 'Verifying that PostgreSQL contains the test order...'

                bat '''
                    docker compose exec -T db psql -U fooduser -d food_orders -c "SELECT * FROM orders ORDER BY id;"
                '''
            }
        }
    }

    post {

        failure {
            echo 'Pipeline failed. Displaying useful Docker Compose logs...'

            bat '''
                docker compose ps
                docker compose logs --tail=100
            '''
        }

        always {
            echo 'Stopping application containers while preserving the PostgreSQL volume...'

            bat '''
                docker compose down
            '''
        }
    }
}