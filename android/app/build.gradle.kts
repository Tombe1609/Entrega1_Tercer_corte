import java.net.URI

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

// Se configura en las propiedades de Gradle del equipo o en CI.
val releaseApiUrl = providers.gradleProperty("COOPERATIVA_API_URL")
    .orElse(providers.environmentVariable("COOPERATIVA_API_URL"))
    .map { it.trim().trimEnd('/') + "/" }
val apiUrl = releaseApiUrl.orNull
val apiUri = apiUrl?.let { runCatching { URI(it) }.getOrNull() }
val validReleaseUrl = apiUri != null && apiUri.scheme == "https" && apiUri.host != null &&
    apiUri.userInfo == null && apiUri.rawQuery == null && apiUri.rawFragment == null

android {
    namespace = "com.cooperativa.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.cooperativa.app"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

    }

    buildTypes {
        release {
            resValue("string", "api_base_url", if (validReleaseUrl) apiUrl.orEmpty() else "")
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
        check(validReleaseUrl) {
            "Configura COOPERATIVA_API_URL con la URL base HTTPS de la API desplegada."
        }
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.09.00")
    implementation(composeBom)
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
