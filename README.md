# ThreatExchange Sandbox - Personal Fork

This is a personal fork of Meta's [ThreatExchange](https://github.com/facebook/ThreatExchange) repository focused on developing demonstration tools for the Hasher-Matcher-Actioner (HMA) system. The primary goal is to showcase HMA capabilities through practical implementations for identifying and removing illegal material.

## Current Focus: HMA Review Tool

The main project in this fork is a demonstration review tool for the HMA system designed to:

- Demonstrate efficient identification of illegal material through hash matching
- Provide an intuitive interface for reviewing matched content
- Showcase PDQ hashing and similar algorithms for media matching at scale
- Serve as a reference implementation for similar tools

For more details about the HMA Review Tool, see [PROJECT_NOTES.md](hasher-matcher-actioner/review-tool/PROJECT_NOTES.md).

## Note

This repository is a personal sandbox for exploration and demonstration. For technical questions, official documentation, or production implementations, please refer to the main [Facebook ThreatExchange repository](https://github.com/facebook/ThreatExchange).

## Original Repository Projects

The original repository contains several projects related to media hash matching and threat intelligence:

### PDQ Image Hashing

PDQ converts photos into 256-bit signatures for photo matching.

### TMK+PDQF (TMK) Video Hashing

TMK creates 256KB signatures from videos for video matching.

### Video PDQ (vPDQ)

vPDQ is a video hashing algorithm that identifies matching videos based on shared similar frames, applicable to various image algorithms.

### Hasher-Matcher-Actioner (HMA)

HMA is a hash matching system for AWS that maintains lists of known illegal content for scanning. Content lists can be self-curated or obtained through hash exchange programs. Additional information is available [in the wiki](https://github.com/facebook/ThreatExchange/wiki).

A newer version, "[Open Media Match](https://github.com/facebook/ThreatExchange/tree/main/open-media-match)", is in development with cloud-agnostic Docker-based deployment.

### python-threatexchange

A Python library/CLI tool (`threatexchange` on PyPI) for media scanning and signal exchange, including implementations for downloading hashes from Meta's ThreatExchange API and scanning images with PDQ.

## License

All projects use the BSD license - see [./LICENSE](https://github.com/facebook/ThreatExchange/blob/main/LICENSE). Exceptions for demonstration files have their licenses noted in the file headers.

Exception as of 12/9/2021:
* pdq/cpp/CImg.h


