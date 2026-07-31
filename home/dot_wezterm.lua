local wezterm = require 'wezterm'
local act = wezterm.action

local tabline = wezterm.plugin.require 'https://github.com/michaelbrusegard/tabline.wez'

local config = {}

if wezterm.config_builder then
  config = wezterm.config_builder()
end

local triple = wezterm.target_triple:lower()
local is_windows = triple:find('windows') ~= nil
local is_macos = triple:find('darwin') ~= nil or triple:find('apple') ~= nil
local is_linux = triple:find('linux') ~= nil

-- ---------------------------------------------------------------------------
-- Tab bar helpers
-- ---------------------------------------------------------------------------

-- On Windows the pane runs wsl.exe, so the process tree is full of wrapper
-- processes (wsl.exe, wslhost.exe, conhost.exe, init) rather than the shell.
local function is_ignored_process(name)
  if not name or name == '' then
    return true
  end
  if not is_windows then
    return false
  end
  local lower = name:lower()
  return lower:find('wsl') ~= nil
    or lower == 'conhost'
    or lower == 'openconsole'
    or lower == 'init'
end

local function clean_proc_name(name)
  if not name or name == '' then
    return ''
  end
  local clean = name:gsub('.*[/\\]', ''):gsub('%.[eE][xX][eE]$', '')
  return clean
end

local function find_valid_process(proc_info)
  if not proc_info then
    return nil
  end

  if proc_info.children and #proc_info.children > 0 then
    for i = #proc_info.children, 1, -1 do
      local found = find_valid_process(proc_info.children[i])
      if found then
        return found
      end
    end
  end

  if proc_info.name then
    local cleaned = clean_proc_name(proc_info.name)
    if not is_ignored_process(cleaned) then
      return cleaned
    end
  end

  return nil
end

-- Resolve the process actually running in the tab
local function get_active_process_name(tab)
  local pane_info = (tab and tab.active_pane) or tab
  if not pane_info then
    return 'zsh'
  end

  local pane_id = pane_info.pane_id
  local mux_pane = nil
  if pane_id and wezterm.mux then
    mux_pane = wezterm.mux.get_pane(pane_id)
  end

  local proc_name = ''

  -- 1. mux_pane:get_foreground_process_info()
  if mux_pane and mux_pane.get_foreground_process_info then
    local info = mux_pane:get_foreground_process_info()
    local valid_proc = find_valid_process(info)
    if valid_proc and valid_proc ~= '' then
      proc_name = valid_proc
    end
  end

  -- 2. mux_pane:get_foreground_process_name()
  if (proc_name == '' or is_ignored_process(proc_name)) and mux_pane and mux_pane.get_foreground_process_name then
    local fg = mux_pane:get_foreground_process_name()
    if fg then
      local cleaned = clean_proc_name(fg)
      if not is_ignored_process(cleaned) then
        proc_name = cleaned
      end
    end
  end

  -- 3. pane_info.title / mux_pane:get_title() (OSC 2 reported by the shell)
  if proc_name == '' or is_ignored_process(proc_name) then
    local title = (mux_pane and mux_pane.get_title and mux_pane:get_title()) or pane_info.title or ''
    if title ~= '' and not is_ignored_process(title) then
      local first_word = title:match('^(%S+)')
      if first_word then
        local cleaned = clean_proc_name(first_word)
        if not is_ignored_process(cleaned) then
          proc_name = cleaned
        end
      end
      if (proc_name == '' or is_ignored_process(proc_name)) and not is_ignored_process(title) then
        local cleaned = clean_proc_name(title)
        if not is_ignored_process(cleaned) then
          proc_name = cleaned
        end
      end
    end
  end

  -- 4. Final fallback
  if proc_name == '' or is_ignored_process(proc_name) then
    proc_name = 'zsh'
  end

  return proc_name
end

local process_icons = {
  zsh = '',
  bash = '',
  fish = '',
  sh = '',
  cmd = '',
  powershell = '󰨊',
  pwsh = '󰨊',
  nvim = '',
  vim = '',
  vi = '',
  git = '',
  node = '',
  npm = '',
  npx = '',
  yarn = '',
  pnpm = '',
  bun = '',
  python = '',
  python3 = '',
  cargo = '',
  go = '',
  docker = '',
  sudo = '󰌋',
  ssh = '󰣀',
  tmux = '',
  yazi = '󰇥',
  lazygit = '',
}

local function get_active_process_name_with_icon(tab)
  local proc_name = get_active_process_name(tab)
  local icon = process_icons[proc_name:lower()] or ''
  return string.format('%s %s', icon, proc_name)
end

-- Working directory of the tab, reported by the shell via OSC 7
local function get_cwd(tab)
  local pane = (tab and tab.active_pane) or tab
  if not pane then
    return ''
  end

  local cwd_url = pane.current_working_dir
  if not cwd_url then
    return ''
  end

  local path = cwd_url.file_path
  if not path or path == '' then
    return ''
  end

  -- Percent-decode (%20 -> space, etc.)
  path = path:gsub('%%(%x%x)', function(hex)
    return string.char(tonumber(hex, 16))
  end)

  -- UNC paths (//wsl$/Ubuntu/... , //wsl.localhost/Ubuntu/...) -> absolute WSL path
  path = path:gsub('^//wsl%$.-/', '/'):gsub('^//wsl%.localhost/.-/', '/')

  -- Windows drive paths (/C:/Users/... -> /mnt/c/Users/...)
  path = path:gsub('^/([A-Za-z]):/', function(drive)
    return '/mnt/' .. drive:lower() .. '/'
  end)

  -- /home/<user> -> ~
  local user = os.getenv('USER') or os.getenv('LOGNAME')
  if user and user ~= '' then
    path = path:gsub('^/home/' .. user, '~')
  else
    path = path:gsub('^/home/[^/]+', '~')
  end

  -- Drop the trailing slash (except for the root '/')
  if #path > 1 and path:sub(-1) == '/' then
    path = path:sub(1, -2)
  end

  return string.format('󰉋 %s', path)
end

tabline.setup({
  options = {
    tab_bar_at_bottom = true,
  },
  sections = {
    tab_active = {
      'index',
      get_active_process_name_with_icon,
      get_cwd,
      { 'zoomed', padding = 0 },
    },
    tab_inactive = {
      'index',
      get_active_process_name_with_icon,
      get_cwd,
    },
  },
})

-- ---------------------------------------------------------------------------
-- Domain
-- ---------------------------------------------------------------------------

if is_windows then
  -- The default WSL domains already start in the Linux home directory; new tabs
  -- inherit the cwd of the current pane, which requires the shell to report it
  -- via OSC 7 (see ~/.config/zsh/rc.d/91-osc7-cwd.zsh).
  config.default_domain = 'WSL:Ubuntu'
end

-- ---------------------------------------------------------------------------
-- Appearance
-- ---------------------------------------------------------------------------

config.color_scheme = 'Tokyo Night Storm (Gogh)'
config.font_size = 12
config.font = wezterm.font_with_fallback {
  {
    family = 'MonaspiceAr Nerd Font Mono',
    weight = 'Regular',
  },
  {
    family = 'BIZ UDGothic',
    weight = 'Regular',
  },
  'Noto Color Emoji',
}

config.tab_bar_at_bottom = true
config.default_cursor_style = 'BlinkingUnderline'
config.enable_scroll_bar = true

-- Background opacity and OS-specific background blur settings
config.window_background_opacity = 0.85
if is_macos then
  config.macos_window_background_blur = 20
elseif is_windows then
  config.win32_system_backdrop = 'Acrylic'
elseif is_linux then
  config.kde_wayland_background_blur = true
end

-- ---------------------------------------------------------------------------
-- Window
-- ---------------------------------------------------------------------------

config.initial_rows = 36
config.initial_cols = 120
config.window_close_confirmation = 'NeverPrompt'

-- ---------------------------------------------------------------------------
-- Input
-- ---------------------------------------------------------------------------

config.use_ime = true
config.keys = {
  { key = 'v', mods = 'CTRL', action = act.PasteFrom 'Clipboard' },
}

tabline.apply_to_config(config)

-- Keep the OS title bar and window frame, overriding what tabline applies
config.window_decorations = 'TITLE | RESIZE'

return config
