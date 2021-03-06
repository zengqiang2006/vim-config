autoload colors; colors

# The variables are wrapped in %{%}. This should be the case for every
# variable that does not contain space.
for COLOR in RED GREEN YELLOW BLUE MAGENTA CYAN BLACK WHITE; do
  eval PR_$COLOR='%{$fg_no_bold[${(L)COLOR}]%}'
  eval PR_BOLD_$COLOR='%{$fg_bold[${(L)COLOR}]%}'
done

eval RESET='$reset_color'
export PR_RED PR_GREEN PR_YELLOW PR_BLUE PR_WHITE PR_BLACK
export PR_BOLD_RED PR_BOLD_GREEN PR_BOLD_YELLOW PR_BOLD_BLUE
export PR_BOLD_WHITE PR_BOLD_BLACK

# Clear LSCOLORS (so that LS_COLORS is used)
unset LSCOLORS

# Main change, you can see directories on a dark background
#expor tLSCOLORS=gxfxcxdxbxegedabagacad

export CLICOLOR=1
export TERM=xterm-256color

# use `dircolors` or `gdircolors` to set LS_COLORS
if hash dircolors 2>/dev/null; then
  DIRCOLORS=dircolors
elif hash gdircolors 2>/dev/null; then
  DIRCOLORS=gdircolors
fi

# Coloring by filetype (for ls).
# Append user's ~/.dir_colors if it exists.
if [ -e ~/.dir_colors ] || [ -e /etc/DIR_COLORS ]; then
  GLOBAL=$([ -e /etc/DIR_COLORS ] && echo /etc/DIR_COLORS)
  LOCAL=$([ -e ~/.dir_colors ] && echo ~/.dir_colors)
  eval "$($DIRCOLORS -b <(cat $GLOBAL $LOCAL))"
fi
