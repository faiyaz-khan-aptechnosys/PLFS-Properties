
pipeline {
    agent any

    tools {
        nodejs 'Node24'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('TypeScript Check') {
            steps {
                bat 'npx tsc --noEmit'
            }
        }

        stage('Lint') {
            steps {
                bat 'npm run lint'
            }
        }

        stage('Production Build') {
            steps {
                bat 'npm run build'
            }
        }
    }

    post {
        success {
            echo 'PLFS Properties CI completed successfully!'
        }
        failure {
            echo 'CI failed. Check the console output.'
        }
    }
}
