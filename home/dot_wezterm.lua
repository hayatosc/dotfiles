local wezterm = require 'wezterm'
local act = wezterm.action

local tabline = wezterm.plugin.require 'https://github.com/michaelbrusegard/tabline.wez'

local config = {}

if wezterm.config_builder then
  config = wezterm.config_builder()
end

if wezterm.target_triple:find('windows') then
  config.default_domain = 'WSL:Ubuntu'
end

-- 無視対象プロセス判定 (wslhost, wsl, conhost 等を除外)
local function is_ignored_process(name)
  if not name or name == '' then
    return true
  end
  local lower = name:lower()
  if lower:find('wsl') or lower:find('conhost') or lower:find('openconsole') or lower:find('init') then
    return true
  end
  return false
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

-- タブ内で実際に動作しているアクティブなプロセス名を取得する関数
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

  -- 1. mux_pane:get_foreground_process_info() から探す
  if mux_pane and mux_pane.get_foreground_process_info then
    local info = mux_pane:get_foreground_process_info()
    local valid_proc = find_valid_process(info)
    if valid_proc and valid_proc ~= '' then
      proc_name = valid_proc
    end
  end

  -- 2. mux_pane:get_foreground_process_name() から探す
  if (proc_name == '' or is_ignored_process(proc_name)) and mux_pane and mux_pane.get_foreground_process_name then
    local fg = mux_pane:get_foreground_process_name()
    if fg then
      local cleaned = clean_proc_name(fg)
      if not is_ignored_process(cleaned) then
        proc_name = cleaned
      end
    end
  end

  -- 3. pane_info.title / mux_pane:get_title() から探す
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

  -- 4. 最終フォールバック
  if proc_name == '' or is_ignored_process(proc_name) then
    proc_name = 'zsh'
  end

  return proc_name
end

-- プロセス名に応じたアイコンのマッピング
local process_icons = {
  zsh = '',
  bash = '',
  fish = '',
  sh = '',
  cmd = '',
  powershell = '󰨊',
  pwsh = '󰨊',
  nvim = '',
  vim = '',
  vi = '',
  git = '',
  node = '',
  npm = '',
  npx = '',
  yarn = '',
  pnpm = '',
  bun = '',
  python = '',
  python3 = '',
  cargo = '',
  go = '',
  docker = '',
  sudo = '󰌋',
  ssh = '󰣀',
  tmux = '',
  yazi = '󰇥',
  lazygit = '',
}

local function get_active_process_name_with_icon(tab)
  local proc_name = get_active_process_name(tab)
  local icon = process_icons[proc_name:lower()] or ''
  return string.format('%s %s', icon, proc_name)
end

-- tabline.wez 設定 (画面下部配置 & アクティブプロセス表示)
tabline.setup({
  options = {
    tab_bar_at_bottom = true,
  },
  sections = {
    tab_active = {
      'index',
      get_active_process_name_with_icon,
      { 'zoomed', padding = 0 },
    },
    tab_inactive = {
      'index',
      get_active_process_name_with_icon,
    },
  },
})

-- OS標準のタイトルバー & ウィンドウ枠
config.window_decorations = 'TITLE | RESIZE'
config.tab_bar_at_bottom = true

config.default_cursor_style = 'BlinkingUnderline'
config.enable_scroll_bar = true

-- Background opacity and OS-specific background blur settings
config.window_background_opacity = 0.85

local triple = wezterm.target_triple:lower()
if triple:find('darwin') or triple:find('apple') then
  config.macos_window_background_blur = 20
elseif triple:find('windows') then
  config.win32_system_backdrop = 'Acrylic'
elseif triple:find('linux') then
  config.kde_wayland_background_blur = true
end

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

-- ウィンドウを閉じる際の確認ダイアログを無効化
config.window_close_confirmation = 'NeverPrompt'

config.keys = {
  { key = 'v', mods = 'CTRL', action = act.PasteFrom 'Clipboard' },
}

-- tabline.wez の設定を config に適用
tabline.apply_to_config(config)

-- OS標準のタイトルバー & ウィンドウ枠を適用
config.window_decorations = 'TITLE | RESIZE'

return config
