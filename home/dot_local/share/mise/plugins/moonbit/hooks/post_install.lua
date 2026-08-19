function PLUGIN:PostInstall(ctx)
    local root_path = ctx.rootPath
    local sdk_info = ctx.sdkInfo and (ctx.sdkInfo["moonbit"] or ctx.sdkInfo[PLUGIN.name])
    local version = (sdk_info and sdk_info.version) or ctx.version or "latest"
    local cmd = "export MOON_HOME=" .. root_path .. " && export MOONBIT_INSTALL_VERSION=" .. version .. " && curl -fsSL https://cli.moonbitlang.com/install/unix.sh | bash"
    local status = os.execute(cmd)
    if type(status) == "number" and status ~= 0 then
        error("Failed to install moonbit via unix.sh")
    end
end
