#!/bin/sh
#

#if [ -d /etc/X11/xinit/xinitrc.d ]; then
#    for f in /etc/X11/xinit/xinitrc.d/*; do
#        [ -x "$f" ] && . "$f"
#    done
#    unset f
#fi

export GTK2_RC_FILES="$HOME/.gtkrc-2.0"

~/.screenlayout/layout.sh
~/.fehbg
xrdb -load ~/.Xresources
exec i3
