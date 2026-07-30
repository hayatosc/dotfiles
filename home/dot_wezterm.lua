local wezterm = require 'wezterm'
local act = wezterm.action

local config = {}

if wezterm.config_builder then
  config = wezterm.config_builder()
end

if wezterm.target_triple:find('windows') then
  config.default_domain = 'WSL:Ubuntu'
end

-- OS/Linuxディストリビューションとアイコンのマッピング
local distro_icons = {
  ubuntu = '',
  debian = '',
  fedora = '',
  arch = '',
  alpine = '',
  centos = '',
  rhel = '',
  nixos = '',
  gentoo = '',
  kali = '',
  manjaro = '',
  mint = '',
  macos = '',
  darwin = '',
  windows = '',
  linux = '',
}

-- OS/ディストリビューション情報とアイコンを取得
local function get_os_info(tab)
  local pane = tab.active_pane
  local title = tab.tab_title
  if not title or #title == 0 then
    title = pane.title or ''
  end

  local domain = pane.domain_name or ''
  local os_name = ''

  -- 1. WSLドメインから判別 (例: WSL:Ubuntu, WSL:Fedora)
  if domain:find('WSL:') then
    os_name = domain:gsub('WSL:', '')
  -- 2. プロセス名が wslhost / wsl.exe の場合
  elseif title:find('wslhost') or title:find('wsl%.exe') then
    os_name = 'Ubuntu'
  end

  -- 3. target_triple から判定
  if os_name == '' then
    local triple = wezterm.target_triple:lower()
    if triple:find('windows') then
      os_name = 'Windows'
    elseif triple:find('darwin') or triple:find('apple') then
      os_name = 'macOS'
    elseif triple:find('linux') then
      os_name = 'Linux'
    else
      os_name = title ~= '' and title or 'Terminal'
    end
  end

  -- アイコンの検索
  local key = os_name:lower()
  local icon = ''
  for k, v in pairs(distro_icons) do
    if key:find(k) then
      icon = v
      break
    end
  end

  return icon, os_name
end

-- タブタイトル表示のカスタマイズ（OSアイコン + OS名のみ表示）
wezterm.on('format-tab-title', function(tab, tabs, panes, config, hover, max_width)
  local icon, name = get_os_info(tab)
  return string.format(' %d: %s %s ', tab.tab_index + 1, icon, name)
end)

config.window_decorations = 'INTEGRATED_BUTTONS'
config.default_cursor_style = 'BlinkingUnderline'
config.enable_scroll_bar = true

config.use_ime = true
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

config.initial_rows = 36
config.initial_cols = 120

config.keys = {
  { key = 'v', mods = 'CTRL', action = act.PasteFrom 'Clipboard' },
}

return config
