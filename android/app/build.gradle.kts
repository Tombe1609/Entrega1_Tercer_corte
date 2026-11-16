plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

// La firma release toma sus secretos del entorno local/CI, nunca de archivos versionados.
val releaseSigningValues = listOf(
    providers.environmentVariable("COOPERATIVA_RELEASE_KEYSTORE").orNull,
    providers.environmentVariable("COOPERATIVA_RELEASE_STORE_PASSWORD").orNull,
    providers.environmentVariable("COOPERATIVA_RELEASE_KEY_ALIAS").orNull,
    providers.environmentVariable("COOPERATIVA_RELEASE_KEY_PASSWORD").orNull,
)
val releaseSigningConfigured = releaseSigningValues.all { !it.isNullOrBlank() }
val releaseSigningPartiallyConfigured = releaseSigningValues.any { !it.isNullOrBlank() } && !releaseSigningConfigured

android {
    namespace = "com.cooperativa.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.cooperativa.app"
        minSdk = 26
        targetSdk = 34
        versionCode = 7
        versionName = "1.5.1"

    }

    signingConfigs {
        create("release") {
            if (releaseSigningConfigured) {
                storeFile = file(releaseSigningValues[0]!!)
                storePassword = releaseSigningValues[1]
                keyAlias = releaseSigningValues[2]
                keyPassword = releaseSigningValues[3]
            }
        }
    }

    buildTypes {
        release {
            if (releaseSigningConfigured) signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
}

tasks.matching { it.name == "preReleaseBuild" }.configureEach {
    doFirst {
        check(!releaseSigningPartiallyConfigured) {
            "Configura juntas las cuatro variables COOPERATIVA_RELEASE_* o elimina las variables incompletas."
        }
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.09.00")
    implementation(composeBom)
    // Animaciones sutiles de Compose para cambios de tamaño y transición entre estados.
    implementation("androidx.compose.animation:animation")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.compose.foundation:foundation")
    debugImplementation("androidx.compose.ui:ui-tooling")

    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-compose:1.9.2")
    implementation("androidx.navigation:navigation-compose:2.8.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.5")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.5")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")

    // Cliente HTTP para consumir la API REST
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
}
