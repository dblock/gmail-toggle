# Icons

The extension icons in [public/icons](../../public/icons) (`icon_16.png` to `icon_512.png`) are an open envelope, [Unread icons created by Milkghost Studio - Flaticon](https://www.flaticon.com/free-icons/unread). The toolbar button shows that open envelope while every category and label is shown.

[envelope-closed.svg](envelope-closed.svg) is a closed envelope drawn for this project in the same color and width, shown on the toolbar button while read categories and labels are hidden. Regenerate its PNGs with [rsvg-convert](https://gitlab.gnome.org/GNOME/librsvg) after changing it.

```bash
for size in 16 32; do
  rsvg-convert --width $size --height $size --output public/icons/icon_closed_$size.png assets/icons/envelope-closed.svg
done
```
