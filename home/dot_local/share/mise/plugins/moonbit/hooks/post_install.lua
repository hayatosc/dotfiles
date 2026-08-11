function PLUGIN:PostInstall(ctx)
    local root_path = ctx.rootPath
    local version = ctx.runtimeVersion or "latest"
    local cmd = "export MOON_HOME=" .. root_path .. " && export MOONBIT_INSTALL_VERSION=" .. version .. " && curl -fsSL https://cli.moonbitlang.com/install/unix.sh | bash"
    local status = os.execute(cmd)
    if type(status) == "number" and status ~= 0 then
        error("Failed to install moonbit via unix.sh")
    end
end
