# Curve Processing and Analysis

This project provides Python functions for processing and analyzing 2D curves. The functionalities include curve regularization, curve completion, and symmetry detection. The project uses libraries such as NumPy, SciPy, and Shapely to handle numerical operations, interpolation, and geometric processing.

## Contents

1. [Curve Regularization](#curve-regularization)
2. [Curve Completion](#curve-completion)
3. [Symmetry Detection](#symmetry-detection)
4. [Setup and Usage](#setup-and-usage)

## Curve Regularization

### Overview

This functionality regularizes curves in 2D space by identifying and converting them into regular shapes such as straight lines, circles, ellipses, rectangles, rounded rectangles, regular polygons, and star shapes. If the shape cannot be regularized into any of these categories, it is approximated using Bézier curves.

### Key Functions

- `regularize_curves(csv_path)`: Regularizes curves defined in a CSV file. The CSV file should contain polylines where each polyline is defined by a sequence of points.

