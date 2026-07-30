local wezterm = require 'wezterm'
local act = wezterm.action

local config = {}

if wezterm.config_builder then
  config = wezterm.config_builder()
end

if wezterm.target_triple:find('windows') then
  config.default_domain = 'WSL:Ubuntu'
end

config.window_decorations = 'INTEGRATED_BUTTONS'
config.default_cursor_style = 'BlinkingUnderline'
config.enable_scroll_bar = true

config.use_ime = true
config.color_scheme = 'Materia (base16)'
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
