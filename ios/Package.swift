// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "ShopApp",
    platforms: [
        .iOS(.v16),
        .macOS(.v13)
    ],
    products: [
        .library(
            name: "ShopApp",
            targets: ["ShopApp"]
        ),
        .executable(
            name: "ShopAppRunner",
            targets: ["ShopAppRunner"]
        )
    ],
    dependencies: [],
    targets: [
        .target(
            name: "ShopApp",
            dependencies: [],
            path: "Sources/ShopApp"
        ),
        .executableTarget(
            name: "ShopAppRunner",
            dependencies: ["ShopApp"],
            path: "Sources/ShopAppRunner"
        )
    ]
)
