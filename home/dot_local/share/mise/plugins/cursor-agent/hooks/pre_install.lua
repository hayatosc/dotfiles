function PLUGIN:PreInstall(ctx)
    local version = ctx.version
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
    return {
        version = version
    }
end
