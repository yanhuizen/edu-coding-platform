# 检查 MongoDB 27017 端口是否可达
# exit 0 = 通, exit 1 = 不通

try {
    $tcp = Test-NetConnection -ComputerName "127.0.0.1" -Port 27017 -WarningAction SilentlyContinue -InformationLevel Quiet
    if ($tcp) {
        exit 0
    } else {
        exit 1
    }
} catch {
    exit 1
}
