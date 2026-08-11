function PLUGIN:PostInstall(ctx)
    local root_path = ctx.rootPath
    local version = ctx.runtimeVersion or "latest"

    if version == "latest" then
        local handle = io.popen("curl -fsSL https://cursor.com/install 2>/dev/null | grep -oP '(?<=downloads\\.cursor\\.com/lab/)[^/]+' | head -1")
        if handle then
            local result = handle:read("*a")
            handle:close()
            if result and result:match("%S+") then
                version = result:match("%S+")
            end
        end
    end

    local handle_os = io.popen("uname -s")
    local os_str = handle_os and handle_os:read("*l") or "Linux"
    if handle_os then handle_os:close() end

    local os_name = "linux"
    if os_str:find("Darwin") then
        os_name = "darwin"
    end

    local handle_arch = io.popen("uname -m")
    local arch_str = handle_arch and handle_arch:read("*l") or "x86_64"
    if handle_arch then handle_arch:close() end

    local arch_name = "x64"
    if arch_str == "arm64" or arch_str == "aarch64" then
        arch_name = "arm64"
    end

    local url = "https://downloads.cursor.com/lab/" .. version .. "/" .. os_name .. "/" .. arch_name .. "/agent-cli-package.tar.gz"

    local bin_dir = root_path .. "/bin"
    local cmd = "mkdir -p " .. bin_dir .. " && curl -fSL " .. string.format("%q", url) .. " | tar --strip-components=1 -xzf - -C " .. bin_dir .. " && chmod +x " .. bin_dir .. "/*"
    local status = os.execute(cmd)
    if type(status) == "number" and status ~= 0 then
        error("Failed to install cursor-agent from " .. url)
    end
end
