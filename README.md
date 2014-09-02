#DroidScale

Fast Android Asset Conversion. Currently supports SVG as Input File Format using Inkscape CLI for image conversion.
It reads a folder containing *.svg icons, creates the suiting folder structure and converts all icons to all Android Display Densities.

More Information on Android Iconography:
http://developer.android.com/design/style/iconography.html

##DroidScale in Action

Imagine your icon folder:
```
icon_folder/
   finished_asset.svg
````
But for Android Development, you'll need this asset in PNG Format and in 5 different sizes...

Here DroidScale comes in:

`droidscale -i icon_folder -o output_folder`

Creates the following Directory Structure:
```
output_folder/
    drawable-mdpi/...
        finished_asset.png /*48x48px icons*/
    drawable-hdpi/...
        finished_asset.png /*72*72px icons*/
    drawable-xhdpi/...
        finished_asset.png /*96x96px icons*/
    drawable-xxhdpi/...
        finished_asset.png /*144x144px icons*/
    drawable-xxxhdpi/...
        finished_asset.png /*192x192px icons*/
```

voilà: All your icons, perfectly prepared!


##System Requirements:

* Node.js > 0.10
* Inkscape installed and available in your path (try `which inkscape`)

##Usage
```
Usage: droidscale [options]

  Options:

    -h, --help               output usage information
    -V, --version            output the version number
    -f, --filetype [type]    Input file type; supported: svg; defaults to: svg
    -i, --input [folder]     Folder with all images
    -o, --output [folder]    Specify the output folder. If it does not exist, it will be created
    -b, --basesize <pixels>  Base size for mdpi devices in pixels, default 48 results in 48px x 48px icons
```

##Performance:

DroidScale always launches as many Instances of Inkscape in parallel as you have cores.

For ~1250 SVG Icons, resulting in about 6250 Conversions I needed about 300 seconds.

##Developing an own ConversionCommand

This is fairly easy. You just have to add a property to the `commands` Object.
Name this propery like the file extension you want to open with(of course without the dot!).
Now set the value of the property to your command. You can use the following variables:
* `%INPUT%` will be replaced by the path of the input file
* `%SIZE%` will be replaced by the selected size(without units)
* `%OUTPUT%` will be replaced by the path of the target file

For Example: If you want to replace *.tiff Files, and your command looks like this `your-cli -size=48x48 -in=/path/to/source.tiff -out=/path/to/output.png` your porperty would look like this:

```js
"tiff": "your-cli -size=%SIZE%x%SIZE% -in=%INPUT% -out=%OUTPUT%"
```

##F.A.Q

* Is it possible to use another CLI than the inkscape one?
  * Yes! Just specify your command in the `commands` object, look at the Inkscape CLI as an example
* Why do you use Inkscape and not ImageMagick?
  * ImageMagick always blurs my image, so I defaulted to Inkscape. Also Inkscape has a switch to just export the drawn lines, not the whole canvas.
