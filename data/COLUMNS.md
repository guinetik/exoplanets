# Exoplanets Raw Data - Column Descriptions

This document describes the columns in the `exoplanets_raw.csv` file from the NASA Exoplanet Archive.

---

## Identification & Naming

| Column | Description |
|--------|-------------|
| `objectid` | Internal object identifier |
| `pl_name` | Planet name |
| `pl_letter` | Planet letter designation (b, c, d, etc.) |
| `hostid` | Host star identifier |
| `hostname` | Host star name |
| `hd_name` | Henry Draper catalog name |
| `hip_name` | Hipparcos catalog name |
| `tic_id` | TESS Input Catalog ID |
| `sy_name` | System name |
| `systemid` | System identifier |

---

## Discovery Information

| Column | Description |
|--------|-------------|
| `disc_pubdate` | Discovery publication date (YYYY-MM format) |
| `disc_year` | Discovery year |
| `disc_method` | Discovery method (short code) |
| `discoverymethod` | Discovery method (full name: Transit, Radial Velocity, etc.) |
| `disc_locale` | Discovery locale (Ground or Space) |
| `disc_facility` | Discovery facility name |
| `disc_instrument` | Discovery instrument name |
| `disc_telescope` | Discovery telescope name |
| `disc_refname` | Discovery reference (link to publication) |
| `disc_refid` | Discovery reference ID |

---

## Celestial Coordinates

### Right Ascension (RA)
| Column | Description |
|--------|-------------|
| `ra` | Right ascension (decimal degrees) |
| `raerr1` | Right ascension upper error |
| `raerr2` | Right ascension lower error |
| `rasymerr` | Right ascension symmetric error flag |
| `rastr` | Right ascension (sexagesimal string) |
| `ra_solnid` | Right ascension solution ID |
| `ra_reflink` | Right ascension reference link |

### Declination (Dec)
| Column | Description |
|--------|-------------|
| `dec` | Declination (decimal degrees) |
| `decerr1` | Declination upper error |
| `decerr2` | Declination lower error |
| `decsymerr` | Declination symmetric error flag |
| `decstr` | Declination (sexagesimal string) |
| `dec_solnid` | Declination solution ID |
| `dec_reflink` | Declination reference link |

### Galactic Coordinates
| Column | Description |
|--------|-------------|
| `glon` | Galactic longitude (degrees) |
| `glonerr1` | Galactic longitude upper error |
| `glonerr2` | Galactic longitude lower error |
| `glonsymerr` | Galactic longitude symmetric error flag |
| `glonstr` | Galactic longitude string |
| `glon_solnid` | Galactic longitude solution ID |
| `glon_reflink` | Galactic longitude reference link |
| `glat` | Galactic latitude (degrees) |
| `glaterr1` | Galactic latitude upper error |
| `glaterr2` | Galactic latitude lower error |
| `glatsymerr` | Galactic latitude symmetric error flag |
| `glatstr` | Galactic latitude string |
| `glat_solnid` | Galactic latitude solution ID |
| `glat_reflink` | Galactic latitude reference link |

### Ecliptic Coordinates
| Column | Description |
|--------|-------------|
| `elon` | Ecliptic longitude (degrees) |
| `elonerr1` | Ecliptic longitude upper error |
| `elonerr2` | Ecliptic longitude lower error |
| `elonsymerr` | Ecliptic longitude symmetric error flag |
| `elonstr` | Ecliptic longitude string |
| `elon_solnid` | Ecliptic longitude solution ID |
| `elon_reflink` | Ecliptic longitude reference link |
| `elat` | Ecliptic latitude (degrees) |
| `elaterr1` | Ecliptic latitude upper error |
| `elaterr2` | Ecliptic latitude lower error |
| `elatsymerr` | Ecliptic latitude symmetric error flag |
| `elatstr` | Ecliptic latitude string |
| `elat_solnid` | Ecliptic latitude solution ID |
| `elat_reflink` | Ecliptic latitude reference link |

---

## Planetary Orbital Parameters

### Orbital Period
| Column | Description |
|--------|-------------|
| `pl_orbper` | Orbital period (days) |
| `pl_orbpererr1` | Orbital period upper error |
| `pl_orbpererr2` | Orbital period lower error |
| `pl_orbpersymerr` | Orbital period symmetric error flag |
| `pl_orbperlim` | Orbital period limit flag |
| `pl_orbperstr` | Orbital period string format |
| `pl_orbperformat` | Orbital period display format |
| `pl_orbper_solnid` | Orbital period solution ID |
| `pl_orbper_reflink` | Orbital period reference link |

### Argument of Periastron
| Column | Description |
|--------|-------------|
| `pl_orblper` | Argument of periastron (degrees) |
| `pl_orblpererr1` | Argument of periastron upper error |
| `pl_orblpererr2` | Argument of periastron lower error |
| `pl_orblpersymerr` | Argument of periastron symmetric error flag |
| `pl_orblperlim` | Argument of periastron limit flag |
| `pl_orblperstr` | Argument of periastron string format |
| `pl_orblperformat` | Argument of periastron display format |
| `pl_orblper_solnid` | Argument of periastron solution ID |
| `pl_orblper_reflink` | Argument of periastron reference link |

### Semi-Major Axis
| Column | Description |
|--------|-------------|
| `pl_orbsmax` | Semi-major axis (AU) |
| `pl_orbsmaxerr1` | Semi-major axis upper error |
| `pl_orbsmaxerr2` | Semi-major axis lower error |
| `pl_orbsmaxsymerr` | Semi-major axis symmetric error flag |
| `pl_orbsmaxlim` | Semi-major axis limit flag |
| `pl_orbsmaxstr` | Semi-major axis string format |
| `pl_orbsmaxformat` | Semi-major axis display format |
| `pl_orbsmax_solnid` | Semi-major axis solution ID |
| `pl_orbsmax_reflink` | Semi-major axis reference link |

### Orbital Inclination
| Column | Description |
|--------|-------------|
| `pl_orbincl` | Orbital inclination (degrees) |
| `pl_orbinclerr1` | Orbital inclination upper error |
| `pl_orbinclerr2` | Orbital inclination lower error |
| `pl_orbinclsymerr` | Orbital inclination symmetric error flag |
| `pl_orbincllim` | Orbital inclination limit flag |
| `pl_orbinclstr` | Orbital inclination string format |
| `pl_orbinclformat` | Orbital inclination display format |
| `pl_orbincl_solnid` | Orbital inclination solution ID |
| `pl_orbincl_reflink` | Orbital inclination reference link |

### Time of Periastron
| Column | Description |
|--------|-------------|
| `pl_orbtper` | Time of periastron (Julian Date) |
| `pl_orbtpererr1` | Time of periastron upper error |
| `pl_orbtpererr2` | Time of periastron lower error |
| `pl_orbtpersymerr` | Time of periastron symmetric error flag |
| `pl_orbtperlim` | Time of periastron limit flag |
| `pl_orbtperstr` | Time of periastron string format |
| `pl_orbtperformat` | Time of periastron display format |
| `pl_orbtper_solnid` | Time of periastron solution ID |
| `pl_orbtper_reflink` | Time of periastron reference link |
| `pl_orbtper_systemref` | Time of periastron system reference |

### Orbital Eccentricity
| Column | Description |
|--------|-------------|
| `pl_orbeccen` | Orbital eccentricity |
| `pl_orbeccenerr1` | Orbital eccentricity upper error |
| `pl_orbeccenerr2` | Orbital eccentricity lower error |
| `pl_orbeccensymerr` | Orbital eccentricity symmetric error flag |
| `pl_orbeccenlim` | Orbital eccentricity limit flag |
| `pl_orbeccenstr` | Orbital eccentricity string format |
| `pl_orbeccenformat` | Orbital eccentricity display format |
| `pl_orbeccen_solnid` | Orbital eccentricity solution ID |
| `pl_orbeccen_reflink` | Orbital eccentricity reference link |

---

## Planetary Physical Parameters

### Planet Radius
| Column | Description |
|--------|-------------|
| `pl_radj` | Planet radius (Jupiter radii) |
| `pl_radjerr1` | Planet radius upper error (Jupiter radii) |
| `pl_radjerr2` | Planet radius lower error (Jupiter radii) |
| `pl_radjsymerr` | Planet radius symmetric error flag |
| `pl_radjlim` | Planet radius limit flag |
| `pl_radjstr` | Planet radius string format |
| `pl_radjformat` | Planet radius display format |
| `pl_radj_solnid` | Planet radius solution ID |
| `pl_radj_reflink` | Planet radius reference link |
| `pl_rade` | Planet radius (Earth radii) |
| `pl_radeerr1` | Planet radius upper error (Earth radii) |
| `pl_radeerr2` | Planet radius lower error (Earth radii) |
| `pl_radesymerr` | Planet radius symmetric error flag |
| `pl_radelim` | Planet radius limit flag |
| `pl_radestr` | Planet radius string format |
| `pl_radeformat` | Planet radius display format |
| `pl_rade_solnid` | Planet radius solution ID |
| `pl_rade_reflink` | Planet radius reference link |

### Planet Mass
| Column | Description |
|--------|-------------|
| `pl_massj` | Planet mass (Jupiter masses) |
| `pl_massjerr1` | Planet mass upper error (Jupiter masses) |
| `pl_massjerr2` | Planet mass lower error (Jupiter masses) |
| `pl_massjsymerr` | Planet mass symmetric error flag |
| `pl_massjlim` | Planet mass limit flag |
| `pl_massjstr` | Planet mass string format |
| `pl_massjformat` | Planet mass display format |
| `pl_massj_solnid` | Planet mass solution ID |
| `pl_massj_reflink` | Planet mass reference link |
| `pl_masse` | Planet mass (Earth masses) |
| `pl_masseerr1` | Planet mass upper error (Earth masses) |
| `pl_masseerr2` | Planet mass lower error (Earth masses) |
| `pl_massesymerr` | Planet mass symmetric error flag |
| `pl_masselim` | Planet mass limit flag |
| `pl_massestr` | Planet mass string format |
| `pl_masseformat` | Planet mass display format |
| `pl_masse_solnid` | Planet mass solution ID |
| `pl_masse_reflink` | Planet mass reference link |

### Best Mass Estimate
| Column | Description |
|--------|-------------|
| `pl_bmassj` | Best mass estimate (Jupiter masses) |
| `pl_bmassjerr1` | Best mass upper error (Jupiter masses) |
| `pl_bmassjerr2` | Best mass lower error (Jupiter masses) |
| `pl_bmassjsymerr` | Best mass symmetric error flag |
| `pl_bmassjlim` | Best mass limit flag |
| `pl_bmassjstr` | Best mass string format |
| `pl_bmassjformat` | Best mass display format |
| `pl_bmassj_solnid` | Best mass solution ID |
| `pl_bmassj_reflink` | Best mass reference link |
| `pl_bmasse` | Best mass estimate (Earth masses) |
| `pl_bmasseerr1` | Best mass upper error (Earth masses) |
| `pl_bmasseerr2` | Best mass lower error (Earth masses) |
| `pl_bmassesymerr` | Best mass symmetric error flag |
| `pl_bmasselim` | Best mass limit flag |
| `pl_bmassestr` | Best mass string format |
| `pl_bmasseformat` | Best mass display format |
| `pl_bmasse_solnid` | Best mass solution ID |
| `pl_bmasse_reflink` | Best mass reference link |
| `pl_bmassprov` | Best mass provenance (source/method) |

### Candidate Mass (M*sin(i))
| Column | Description |
|--------|-------------|
| `pl_cmassj` | Candidate mass (Jupiter masses) |
| `pl_cmassjerr1` | Candidate mass upper error |
| `pl_cmassjerr2` | Candidate mass lower error |
| `pl_cmassjsymerr` | Candidate mass symmetric error flag |
| `pl_cmassjlim` | Candidate mass limit flag |
| `pl_cmassjstr` | Candidate mass string format |
| `pl_cmassjformat` | Candidate mass display format |
| `pl_cmassj_solnid` | Candidate mass solution ID |
| `pl_cmassj_reflink` | Candidate mass reference link |
| `pl_cmasse` | Candidate mass (Earth masses) |
| `pl_cmasseerr1` | Candidate mass upper error |
| `pl_cmasseerr2` | Candidate mass lower error |
| `pl_cmassesymerr` | Candidate mass symmetric error flag |
| `pl_cmasselim` | Candidate mass limit flag |
| `pl_cmassestr` | Candidate mass string format |
| `pl_cmasseformat` | Candidate mass display format |
| `pl_cmasse_solnid` | Candidate mass solution ID |
| `pl_cmasse_reflink` | Candidate mass reference link |

### Minimum Mass (M*sin(i))
| Column | Description |
|--------|-------------|
| `pl_msinij` | Minimum mass M*sin(i) (Jupiter masses) |
| `pl_msinijerr1` | Minimum mass upper error |
| `pl_msinijerr2` | Minimum mass lower error |
| `pl_msinijsymerr` | Minimum mass symmetric error flag |
| `pl_msinijlim` | Minimum mass limit flag |
| `pl_msinijstr` | Minimum mass string format |
| `pl_msinijformat` | Minimum mass display format |
| `pl_msinij_solnid` | Minimum mass solution ID |
| `pl_msinij_reflink` | Minimum mass reference link |
| `pl_msinie` | Minimum mass M*sin(i) (Earth masses) |
| `pl_msinieerr1` | Minimum mass upper error |
| `pl_msinieerr2` | Minimum mass lower error |
| `pl_msiniesymerr` | Minimum mass symmetric error flag |
| `pl_msinielim` | Minimum mass limit flag |
| `pl_msiniestr` | Minimum mass string format |
| `pl_msinieformat` | Minimum mass display format |
| `pl_msinie_solnid` | Minimum mass solution ID |
| `pl_msinie_reflink` | Minimum mass reference link |

### Planet Density
| Column | Description |
|--------|-------------|
| `pl_dens` | Planet density (g/cm³) |
| `pl_denserr1` | Planet density upper error |
| `pl_denserr2` | Planet density lower error |
| `pl_denssymerr` | Planet density symmetric error flag |
| `pl_denslim` | Planet density limit flag |
| `pl_densstr` | Planet density string format |
| `pl_densformat` | Planet density display format |
| `pl_dens_solnid` | Planet density solution ID |
| `pl_dens_reflink` | Planet density reference link |

---

## Planet Environmental Parameters

### Equilibrium Temperature
| Column | Description |
|--------|-------------|
| `pl_eqt` | Equilibrium temperature (K) |
| `pl_eqterr1` | Equilibrium temperature upper error |
| `pl_eqterr2` | Equilibrium temperature lower error |
| `pl_eqtsymerr` | Equilibrium temperature symmetric error flag |
| `pl_eqtlim` | Equilibrium temperature limit flag |
| `pl_eqtstr` | Equilibrium temperature string format |
| `pl_eqtformat` | Equilibrium temperature display format |
| `pl_eqt_solnid` | Equilibrium temperature solution ID |
| `pl_eqt_reflink` | Equilibrium temperature reference link |

### Insolation Flux
| Column | Description |
|--------|-------------|
| `pl_insol` | Insolation flux (Earth flux) |
| `pl_insolerr1` | Insolation flux upper error |
| `pl_insolerr2` | Insolation flux lower error |
| `pl_insolsymerr` | Insolation flux symmetric error flag |
| `pl_insollim` | Insolation flux limit flag |
| `pl_insolstr` | Insolation flux string format |
| `pl_insolformat` | Insolation flux display format |
| `pl_insol_solnid` | Insolation flux solution ID |
| `pl_insol_reflink` | Insolation flux reference link |

---

## Transit Parameters

### Transit Depth
| Column | Description |
|--------|-------------|
| `pl_trandep` | Transit depth (%) |
| `pl_trandeperr1` | Transit depth upper error |
| `pl_trandeperr2` | Transit depth lower error |
| `pl_trandepsymerr` | Transit depth symmetric error flag |
| `pl_trandeplim` | Transit depth limit flag |
| `pl_trandepstr` | Transit depth string format |
| `pl_trandepformat` | Transit depth display format |
| `pl_trandep_solnid` | Transit depth solution ID |
| `pl_trandep_reflink` | Transit depth reference link |

### Transit Midpoint
| Column | Description |
|--------|-------------|
| `pl_tranmid` | Transit midpoint (Julian Date) |
| `pl_tranmiderr1` | Transit midpoint upper error |
| `pl_tranmiderr2` | Transit midpoint lower error |
| `pl_tranmidsymerr` | Transit midpoint symmetric error flag |
| `pl_tranmidlim` | Transit midpoint limit flag |
| `pl_tranmidstr` | Transit midpoint string format |
| `pl_tranmidformat` | Transit midpoint display format |
| `pl_tranmid_solnid` | Transit midpoint solution ID |
| `pl_tranmid_reflink` | Transit midpoint reference link |
| `pl_tranmid_systemref` | Transit midpoint system reference |

### Transit Duration
| Column | Description |
|--------|-------------|
| `pl_trandur` | Transit duration (hours) |
| `pl_trandurerr1` | Transit duration upper error |
| `pl_trandurerr2` | Transit duration lower error |
| `pl_trandursymerr` | Transit duration symmetric error flag |
| `pl_trandurlim` | Transit duration limit flag |
| `pl_trandurstr` | Transit duration string format |
| `pl_trandurformat` | Transit duration display format |
| `pl_trandur_solnid` | Transit duration solution ID |
| `pl_trandur_reflink` | Transit duration reference link |

### Occultation Depth
| Column | Description |
|--------|-------------|
| `pl_occdep` | Occultation depth (%) |
| `pl_occdeperr1` | Occultation depth upper error |
| `pl_occdeperr2` | Occultation depth lower error |
| `pl_occdepsymerr` | Occultation depth symmetric error flag |
| `pl_occdeplim` | Occultation depth limit flag |
| `pl_occdepstr` | Occultation depth string format |
| `pl_occdepformat` | Occultation depth display format |
| `pl_occdep_solnid` | Occultation depth solution ID |
| `pl_occdep_reflink` | Occultation depth reference link |

### Impact Parameter
| Column | Description |
|--------|-------------|
| `pl_imppar` | Impact parameter |
| `pl_impparerr1` | Impact parameter upper error |
| `pl_impparerr2` | Impact parameter lower error |
| `pl_impparsymerr` | Impact parameter symmetric error flag |
| `pl_impparlim` | Impact parameter limit flag |
| `pl_impparstr` | Impact parameter string format |
| `pl_impparformat` | Impact parameter display format |
| `pl_imppar_solnid` | Impact parameter solution ID |
| `pl_imppar_reflink` | Impact parameter reference link |

### Ratio of Planet to Star Radius
| Column | Description |
|--------|-------------|
| `pl_ratror` | Ratio of planet radius to stellar radius |
| `pl_ratrorerr1` | Ratio upper error |
| `pl_ratrorerr2` | Ratio lower error |
| `pl_ratrorsymerr` | Ratio symmetric error flag |
| `pl_ratrorlim` | Ratio limit flag |
| `pl_ratrorstr` | Ratio string format |
| `pl_ratrorformat` | Ratio display format |
| `pl_ratror_solnid` | Ratio solution ID |
| `pl_ratror_reflink` | Ratio reference link |

### Ratio of Semi-Major Axis to Stellar Radius
| Column | Description |
|--------|-------------|
| `pl_ratdor` | Ratio of semi-major axis to stellar radius |
| `pl_ratdorerr1` | Ratio upper error |
| `pl_ratdorerr2` | Ratio lower error |
| `pl_ratdorsymerr` | Ratio symmetric error flag |
| `pl_ratdorlim` | Ratio limit flag |
| `pl_ratdorstr` | Ratio string format |
| `pl_ratdorformat` | Ratio display format |
| `pl_ratdor_solnid` | Ratio solution ID |
| `pl_ratdor_reflink` | Ratio reference link |

---

## Radial Velocity Parameters

| Column | Description |
|--------|-------------|
| `pl_rvamp` | Radial velocity semi-amplitude (m/s) |
| `pl_rvamperr1` | RV semi-amplitude upper error |
| `pl_rvamperr2` | RV semi-amplitude lower error |
| `pl_rvampsymerr` | RV semi-amplitude symmetric error flag |
| `pl_rvamplim` | RV semi-amplitude limit flag |
| `pl_rvampstr` | RV semi-amplitude string format |
| `pl_rvampformat` | RV semi-amplitude display format |
| `pl_rvamp_solnid` | RV semi-amplitude solution ID |
| `pl_rvamp_reflink` | RV semi-amplitude reference link |

---

## Obliquity Parameters

### Projected Obliquity
| Column | Description |
|--------|-------------|
| `pl_projobliq` | Projected obliquity (degrees) |
| `pl_projobliqerr1` | Projected obliquity upper error |
| `pl_projobliqerr2` | Projected obliquity lower error |
| `pl_projobliqsymerr` | Projected obliquity symmetric error flag |
| `pl_projobliqlim` | Projected obliquity limit flag |
| `pl_projobliqstr` | Projected obliquity string format |
| `pl_projobliqformat` | Projected obliquity display format |
| `pl_projobliq_solnid` | Projected obliquity solution ID |
| `pl_projobliq_reflink` | Projected obliquity reference link |

### True Obliquity
| Column | Description |
|--------|-------------|
| `pl_trueobliq` | True obliquity (degrees) |
| `pl_trueobliqerr1` | True obliquity upper error |
| `pl_trueobliqerr2` | True obliquity lower error |
| `pl_trueobliqsymerr` | True obliquity symmetric error flag |
| `pl_trueobliqlim` | True obliquity limit flag |
| `pl_trueobliqstr` | True obliquity string format |
| `pl_trueobliqformat` | True obliquity display format |
| `pl_trueobliq_solnid` | True obliquity solution ID |
| `pl_trueobliq_reflink` | True obliquity reference link |

---

## Angular Separation

| Column | Description |
|--------|-------------|
| `pl_angsep` | Angular separation (arcsec) |
| `pl_angseperr1` | Angular separation upper error |
| `pl_angseperr2` | Angular separation lower error |
| `pl_angseplim` | Angular separation limit flag |
| `pl_angsepformat` | Angular separation display format |
| `pl_angsepstr` | Angular separation string format |
| `pl_angsepsymerr` | Angular separation symmetric error flag |
| `pl_angsep_reflink` | Angular separation reference link |

---

## Host Star Parameters

### Stellar Temperature
| Column | Description |
|--------|-------------|
| `st_teff` | Stellar effective temperature (K) |
| `st_tefferr1` | Stellar temperature upper error |
| `st_tefferr2` | Stellar temperature lower error |
| `st_teffsymerr` | Stellar temperature symmetric error flag |
| `st_tefflim` | Stellar temperature limit flag |
| `st_teffstr` | Stellar temperature string format |
| `st_teffformat` | Stellar temperature display format |
| `st_teff_solnid` | Stellar temperature solution ID |
| `st_teff_reflink` | Stellar temperature reference link |

### Stellar Metallicity
| Column | Description |
|--------|-------------|
| `st_met` | Stellar metallicity [Fe/H] (dex) |
| `st_meterr1` | Stellar metallicity upper error |
| `st_meterr2` | Stellar metallicity lower error |
| `st_metsymerr` | Stellar metallicity symmetric error flag |
| `st_metlim` | Stellar metallicity limit flag |
| `st_metstr` | Stellar metallicity string format |
| `st_metformat` | Stellar metallicity display format |
| `st_met_solnid` | Stellar metallicity solution ID |
| `st_met_reflink` | Stellar metallicity reference link |
| `st_metratio` | Stellar metallicity ratio type (e.g., [Fe/H]) |
| `st_metn` | Stellar metallicity N (nitrogen abundance) |

### Stellar Radial Velocity
| Column | Description |
|--------|-------------|
| `st_radv` | Stellar radial velocity (km/s) |
| `st_radverr1` | Stellar radial velocity upper error |
| `st_radverr2` | Stellar radial velocity lower error |
| `st_radvsymerr` | Stellar radial velocity symmetric error flag |
| `st_radvlim` | Stellar radial velocity limit flag |
| `st_radvstr` | Stellar radial velocity string format |
| `st_radvformat` | Stellar radial velocity display format |
| `st_radv_solnid` | Stellar radial velocity solution ID |
| `st_radv_reflink` | Stellar radial velocity reference link |

### Stellar Rotation Velocity
| Column | Description |
|--------|-------------|
| `st_vsin` | Stellar rotational velocity v*sin(i) (km/s) |
| `st_vsinerr1` | Rotational velocity upper error |
| `st_vsinerr2` | Rotational velocity lower error |
| `st_vsinsymerr` | Rotational velocity symmetric error flag |
| `st_vsinlim` | Rotational velocity limit flag |
| `st_vsinstr` | Rotational velocity string format |
| `st_vsinformat` | Rotational velocity display format |
| `st_vsin_solnid` | Rotational velocity solution ID |
| `st_vsin_reflink` | Rotational velocity reference link |

### Stellar Luminosity
| Column | Description |
|--------|-------------|
| `st_lum` | Stellar luminosity (log solar luminosity) |
| `st_lumerr1` | Stellar luminosity upper error |
| `st_lumerr2` | Stellar luminosity lower error |
| `st_lumsymerr` | Stellar luminosity symmetric error flag |
| `st_lumlim` | Stellar luminosity limit flag |
| `st_lumstr` | Stellar luminosity string format |
| `st_lumformat` | Stellar luminosity display format |
| `st_lum_solnid` | Stellar luminosity solution ID |
| `st_lum_reflink` | Stellar luminosity reference link |

### Stellar Surface Gravity
| Column | Description |
|--------|-------------|
| `st_logg` | Stellar surface gravity (log10 cm/s²) |
| `st_loggerr1` | Surface gravity upper error |
| `st_loggerr2` | Surface gravity lower error |
| `st_loggsymerr` | Surface gravity symmetric error flag |
| `st_logglim` | Surface gravity limit flag |
| `st_loggstr` | Surface gravity string format |
| `st_loggformat` | Surface gravity display format |
| `st_logg_solnid` | Surface gravity solution ID |
| `st_logg_reflink` | Surface gravity reference link |

### Stellar Age
| Column | Description |
|--------|-------------|
| `st_age` | Stellar age (Gyr) |
| `st_ageerr1` | Stellar age upper error |
| `st_ageerr2` | Stellar age lower error |
| `st_agesymerr` | Stellar age symmetric error flag |
| `st_agelim` | Stellar age limit flag |
| `st_agestr` | Stellar age string format |
| `st_ageformat` | Stellar age display format |
| `st_age_solnid` | Stellar age solution ID |
| `st_age_reflink` | Stellar age reference link |

### Stellar Mass
| Column | Description |
|--------|-------------|
| `st_mass` | Stellar mass (solar masses) |
| `st_masserr1` | Stellar mass upper error |
| `st_masserr2` | Stellar mass lower error |
| `st_masssymerr` | Stellar mass symmetric error flag |
| `st_masslim` | Stellar mass limit flag |
| `st_massstr` | Stellar mass string format |
| `st_massformat` | Stellar mass display format |
| `st_mass_solnid` | Stellar mass solution ID |
| `st_mass_reflink` | Stellar mass reference link |

### Stellar Density
| Column | Description |
|--------|-------------|
| `st_dens` | Stellar density (g/cm³) |
| `st_denserr1` | Stellar density upper error |
| `st_denserr2` | Stellar density lower error |
| `st_denssymerr` | Stellar density symmetric error flag |
| `st_denslim` | Stellar density limit flag |
| `st_densstr` | Stellar density string format |
| `st_densformat` | Stellar density display format |
| `st_dens_solnid` | Stellar density solution ID |
| `st_dens_reflink` | Stellar density reference link |

### Stellar Radius
| Column | Description |
|--------|-------------|
| `st_rad` | Stellar radius (solar radii) |
| `st_raderr1` | Stellar radius upper error |
| `st_raderr2` | Stellar radius lower error |
| `st_radsymerr` | Stellar radius symmetric error flag |
| `st_radlim` | Stellar radius limit flag |
| `st_radstr` | Stellar radius string format |
| `st_radformat` | Stellar radius display format |
| `st_rad_solnid` | Stellar radius solution ID |
| `st_rad_reflink` | Stellar radius reference link |

### Stellar Rotation Period
| Column | Description |
|--------|-------------|
| `st_rotp` | Stellar rotation period (days) |
| `st_rotperr1` | Rotation period upper error |
| `st_rotperr2` | Rotation period lower error |
| `st_rotpsymerr` | Rotation period symmetric error flag |
| `st_rotplim` | Rotation period limit flag |
| `st_rotpstr` | Rotation period string format |
| `st_rotpformat` | Rotation period display format |
| `st_rotp_solnid` | Rotation period solution ID |
| `st_rotp_reflink` | Rotation period reference link |

### Stellar Activity
| Column | Description |
|--------|-------------|
| `st_log_rhk` | Stellar activity indicator log(R'HK) |
| `st_log_rhkerr1` | Activity indicator upper error |
| `st_log_rhkerr2` | Activity indicator lower error |
| `st_log_rhksymerr` | Activity indicator symmetric error flag |
| `st_log_rhklim` | Activity indicator limit flag |
| `st_log_rhkstr` | Activity indicator string format |
| `st_log_rhkformat` | Activity indicator display format |
| `st_log_rhk_solnid` | Activity indicator solution ID |
| `st_log_rhk_reflink` | Activity indicator reference link |

### Spectral Type
| Column | Description |
|--------|-------------|
| `st_spectype` | Stellar spectral type |
| `st_spectype_solnid` | Spectral type solution ID |
| `st_spectype_reflink` | Spectral type reference link |

---

## System Parameters

### Proper Motion
| Column | Description |
|--------|-------------|
| `sy_pm` | Total proper motion (mas/yr) |
| `sy_pmerr1` | Total proper motion upper error |
| `sy_pmerr2` | Total proper motion lower error |
| `sy_pmsymerr` | Total proper motion symmetric error flag |
| `sy_pmlim` | Total proper motion limit flag |
| `sy_pmstr` | Total proper motion string format |
| `sy_pmformat` | Total proper motion display format |
| `sy_pm_solnid` | Total proper motion solution ID |
| `sy_pm_reflink` | Total proper motion reference link |
| `sy_pmra` | Proper motion in RA (mas/yr) |
| `sy_pmraerr1` | Proper motion RA upper error |
| `sy_pmraerr2` | Proper motion RA lower error |
| `sy_pmrasymerr` | Proper motion RA symmetric error flag |
| `sy_pmralim` | Proper motion RA limit flag |
| `sy_pmrastr` | Proper motion RA string format |
| `sy_pmraformat` | Proper motion RA display format |
| `sy_pmra_solnid` | Proper motion RA solution ID |
| `sy_pmra_reflink` | Proper motion RA reference link |
| `sy_pmdec` | Proper motion in Dec (mas/yr) |
| `sy_pmdecerr1` | Proper motion Dec upper error |
| `sy_pmdecerr2` | Proper motion Dec lower error |
| `sy_pmdecsymerr` | Proper motion Dec symmetric error flag |
| `sy_pmdeclim` | Proper motion Dec limit flag |
| `sy_pmdecstr` | Proper motion Dec string format |
| `sy_pmdecformat` | Proper motion Dec display format |
| `sy_pmdec_solnid` | Proper motion Dec solution ID |
| `sy_pmdec_reflink` | Proper motion Dec reference link |

### Parallax & Distance
| Column | Description |
|--------|-------------|
| `sy_plx` | Parallax (mas) |
| `sy_plxerr1` | Parallax upper error |
| `sy_plxerr2` | Parallax lower error |
| `sy_plxsymerr` | Parallax symmetric error flag |
| `sy_plxlim` | Parallax limit flag |
| `sy_plxstr` | Parallax string format |
| `sy_plxformat` | Parallax display format |
| `sy_plx_solnid` | Parallax solution ID |
| `sy_plx_reflink` | Parallax reference link |
| `sy_dist` | Distance (pc) |
| `sy_disterr1` | Distance upper error |
| `sy_disterr2` | Distance lower error |
| `sy_distsymerr` | Distance symmetric error flag |
| `sy_distlim` | Distance limit flag |
| `sy_diststr` | Distance string format |
| `sy_distformat` | Distance display format |
| `sy_dist_solnid` | Distance solution ID |
| `sy_dist_reflink` | Distance reference link |

### System Counts
| Column | Description |
|--------|-------------|
| `sy_snum` | Number of stars in system |
| `sy_pnum` | Number of planets in system |
| `sy_mnum` | Number of moons in system |

---

## Photometry - Optical

### B-band Magnitude
| Column | Description |
|--------|-------------|
| `sy_bmag` | B-band magnitude |
| `sy_bmagerr1` | B-band magnitude upper error |
| `sy_bmagerr2` | B-band magnitude lower error |
| `sy_bmaglim` | B-band magnitude limit flag |
| `sy_bmagsymerr` | B-band magnitude symmetric error flag |
| `sy_bmagstr` | B-band magnitude string format |
| `sy_bmagformat` | B-band magnitude display format |
| `sy_bmag_solnid` | B-band magnitude solution ID |
| `sy_bmag_reflink` | B-band magnitude reference link |

### V-band Magnitude
| Column | Description |
|--------|-------------|
| `sy_vmag` | V-band magnitude |
| `sy_vmagerr1` | V-band magnitude upper error |
| `sy_vmagerr2` | V-band magnitude lower error |
| `sy_vmaglim` | V-band magnitude limit flag |
| `sy_vmagsymerr` | V-band magnitude symmetric error flag |
| `sy_vmagstr` | V-band magnitude string format |
| `sy_vmagformat` | V-band magnitude display format |
| `sy_vmag_solnid` | V-band magnitude solution ID |
| `sy_vmag_reflink` | V-band magnitude reference link |

### G-band (Gaia) Magnitude
| Column | Description |
|--------|-------------|
| `sy_gmag` | G-band (Gaia) magnitude |
| `sy_gmagerr1` | G-band magnitude upper error |
| `sy_gmagerr2` | G-band magnitude lower error |
| `sy_gmaglim` | G-band magnitude limit flag |
| `sy_gmagsymerr` | G-band magnitude symmetric error flag |
| `sy_gmagstr` | G-band magnitude string format |
| `sy_gmagformat` | G-band magnitude display format |
| `sy_gmag_solnid` | G-band magnitude solution ID |
| `sy_gmag_reflink` | G-band magnitude reference link |

### Gaia Magnitude
| Column | Description |
|--------|-------------|
| `sy_gaiamag` | Gaia magnitude |
| `sy_gaiamagerr1` | Gaia magnitude upper error |
| `sy_gaiamagerr2` | Gaia magnitude lower error |
| `sy_gaiamaglim` | Gaia magnitude limit flag |
| `sy_gaiamagsymerr` | Gaia magnitude symmetric error flag |
| `sy_gaiamagstr` | Gaia magnitude string format |
| `sy_gaiamagformat` | Gaia magnitude display format |
| `sy_gaiamag_solnid` | Gaia magnitude solution ID |
| `sy_gaiamag_reflink` | Gaia magnitude reference link |

### R-band Magnitude
| Column | Description |
|--------|-------------|
| `sy_rmag` | R-band magnitude |
| `sy_rmagerr1` | R-band magnitude upper error |
| `sy_rmagerr2` | R-band magnitude lower error |
| `sy_rmaglim` | R-band magnitude limit flag |
| `sy_rmagsymerr` | R-band magnitude symmetric error flag |
| `sy_rmagstr` | R-band magnitude string format |
| `sy_rmagformat` | R-band magnitude display format |
| `sy_rmag_solnid` | R-band magnitude solution ID |
| `sy_rmag_reflink` | R-band magnitude reference link |

### I-band Magnitude
| Column | Description |
|--------|-------------|
| `sy_imag` | I-band magnitude |
| `sy_imagerr1` | I-band magnitude upper error |
| `sy_imagerr2` | I-band magnitude lower error |
| `sy_imaglim` | I-band magnitude limit flag |
| `sy_imagsymerr` | I-band magnitude symmetric error flag |
| `sy_imagstr` | I-band magnitude string format |
| `sy_imagformat` | I-band magnitude display format |
| `sy_imag_solnid` | I-band magnitude solution ID |
| `sy_imag_reflink` | I-band magnitude reference link |

### Z-band Magnitude
| Column | Description |
|--------|-------------|
| `sy_zmag` | Z-band magnitude |
| `sy_zmagerr1` | Z-band magnitude upper error |
| `sy_zmagerr2` | Z-band magnitude lower error |
| `sy_zmaglim` | Z-band magnitude limit flag |
| `sy_zmagsymerr` | Z-band magnitude symmetric error flag |
| `sy_zmagstr` | Z-band magnitude string format |
| `sy_zmagformat` | Z-band magnitude display format |
| `sy_zmag_solnid` | Z-band magnitude solution ID |
| `sy_zmag_reflink` | Z-band magnitude reference link |

### U-band Magnitude
| Column | Description |
|--------|-------------|
| `sy_umag` | U-band magnitude |
| `sy_umagerr1` | U-band magnitude upper error |
| `sy_umagerr2` | U-band magnitude lower error |
| `sy_umaglim` | U-band magnitude limit flag |
| `sy_umagsymerr` | U-band magnitude symmetric error flag |
| `sy_umagstr` | U-band magnitude string format |
| `sy_umagformat` | U-band magnitude display format |
| `sy_umag_solnid` | U-band magnitude solution ID |
| `sy_umag_reflink` | U-band magnitude reference link |

### IC-band Magnitude
| Column | Description |
|--------|-------------|
| `sy_icmag` | Cousins I-band magnitude |
| `sy_icmagerr1` | IC-band magnitude upper error |
| `sy_icmagerr2` | IC-band magnitude lower error |
| `sy_icmagsymerr` | IC-band magnitude symmetric error flag |
| `sy_icmagstr` | IC-band magnitude string format |
| `sy_icmagformat` | IC-band magnitude display format |
| `sy_icmag_solnid` | IC-band magnitude solution ID |
| `sy_icmag_reflink` | IC-band magnitude reference link |

---

## Photometry - Infrared (2MASS)

### J-band Magnitude
| Column | Description |
|--------|-------------|
| `sy_jmag` | 2MASS J-band magnitude |
| `sy_jmagerr1` | J-band magnitude upper error |
| `sy_jmagerr2` | J-band magnitude lower error |
| `sy_jmaglim` | J-band magnitude limit flag |
| `sy_jmagsymerr` | J-band magnitude symmetric error flag |
| `sy_jmagstr` | J-band magnitude string format |
| `sy_jmagformat` | J-band magnitude display format |
| `sy_jmag_solnid` | J-band magnitude solution ID |
| `sy_jmag_reflink` | J-band magnitude reference link |

### H-band Magnitude
| Column | Description |
|--------|-------------|
| `sy_hmag` | 2MASS H-band magnitude |
| `sy_hmagerr1` | H-band magnitude upper error |
| `sy_hmagerr2` | H-band magnitude lower error |
| `sy_hmaglim` | H-band magnitude limit flag |
| `sy_hmagsymerr` | H-band magnitude symmetric error flag |
| `sy_hmagstr` | H-band magnitude string format |
| `sy_hmagformat` | H-band magnitude display format |
| `sy_hmag_solnid` | H-band magnitude solution ID |
| `sy_hmag_reflink` | H-band magnitude reference link |

### K-band Magnitude
| Column | Description |
|--------|-------------|
| `sy_kmag` | 2MASS Ks-band magnitude |
| `sy_kmagerr1` | K-band magnitude upper error |
| `sy_kmagerr2` | K-band magnitude lower error |
| `sy_kmaglim` | K-band magnitude limit flag |
| `sy_kmagsymerr` | K-band magnitude symmetric error flag |
| `sy_kmagstr` | K-band magnitude string format |
| `sy_kmagformat` | K-band magnitude display format |
| `sy_kmag_solnid` | K-band magnitude solution ID |
| `sy_kmag_reflink` | K-band magnitude reference link |

---

## Photometry - WISE

### W1 Magnitude (3.4 µm)
| Column | Description |
|--------|-------------|
| `sy_w1mag` | WISE W1 magnitude (3.4 µm) |
| `sy_w1magerr1` | W1 magnitude upper error |
| `sy_w1magerr2` | W1 magnitude lower error |
| `sy_w1maglim` | W1 magnitude limit flag |
| `sy_w1magsymerr` | W1 magnitude symmetric error flag |
| `sy_w1magstr` | W1 magnitude string format |
| `sy_w1magformat` | W1 magnitude display format |
| `sy_w1mag_solnid` | W1 magnitude solution ID |
| `sy_w1mag_reflink` | W1 magnitude reference link |

### W2 Magnitude (4.6 µm)
| Column | Description |
|--------|-------------|
| `sy_w2mag` | WISE W2 magnitude (4.6 µm) |
| `sy_w2magerr1` | W2 magnitude upper error |
| `sy_w2magerr2` | W2 magnitude lower error |
| `sy_w2maglim` | W2 magnitude limit flag |
| `sy_w2magsymerr` | W2 magnitude symmetric error flag |
| `sy_w2magstr` | W2 magnitude string format |
| `sy_w2magformat` | W2 magnitude display format |
| `sy_w2mag_solnid` | W2 magnitude solution ID |
| `sy_w2mag_reflink` | W2 magnitude reference link |

### W3 Magnitude (12 µm)
| Column | Description |
|--------|-------------|
| `sy_w3mag` | WISE W3 magnitude (12 µm) |
| `sy_w3magerr1` | W3 magnitude upper error |
| `sy_w3magerr2` | W3 magnitude lower error |
| `sy_w3maglim` | W3 magnitude limit flag |
| `sy_w3magsymerr` | W3 magnitude symmetric error flag |
| `sy_w3magstr` | W3 magnitude string format |
| `sy_w3magformat` | W3 magnitude display format |
| `sy_w3mag_solnid` | W3 magnitude solution ID |
| `sy_w3mag_reflink` | W3 magnitude reference link |

### W4 Magnitude (22 µm)
| Column | Description |
|--------|-------------|
| `sy_w4mag` | WISE W4 magnitude (22 µm) |
| `sy_w4magerr1` | W4 magnitude upper error |
| `sy_w4magerr2` | W4 magnitude lower error |
| `sy_w4maglim` | W4 magnitude limit flag |
| `sy_w4magsymerr` | W4 magnitude symmetric error flag |
| `sy_w4magstr` | W4 magnitude string format |
| `sy_w4magformat` | W4 magnitude display format |
| `sy_w4mag_solnid` | W4 magnitude solution ID |
| `sy_w4mag_reflink` | W4 magnitude reference link |

---

## Photometry - Mission Specific

### TESS Magnitude
| Column | Description |
|--------|-------------|
| `sy_tmag` | TESS magnitude |
| `sy_tmagerr1` | TESS magnitude upper error |
| `sy_tmagerr2` | TESS magnitude lower error |
| `sy_tmaglim` | TESS magnitude limit flag |
| `sy_tmagsymerr` | TESS magnitude symmetric error flag |
| `sy_tmagstr` | TESS magnitude string format |
| `sy_tmagformat` | TESS magnitude display format |
| `sy_tmag_solnid` | TESS magnitude solution ID |
| `sy_tmag_reflink` | TESS magnitude reference link |

### Kepler Magnitude
| Column | Description |
|--------|-------------|
| `sy_kepmag` | Kepler magnitude |
| `sy_kepmagerr1` | Kepler magnitude upper error |
| `sy_kepmagerr2` | Kepler magnitude lower error |
| `sy_kepmaglim` | Kepler magnitude limit flag |
| `sy_kepmagsymerr` | Kepler magnitude symmetric error flag |
| `sy_kepmagstr` | Kepler magnitude string format |
| `sy_kepformat` | Kepler magnitude display format |
| `sy_kepmag_solnid` | Kepler magnitude solution ID |
| `sy_kepmag_reflink` | Kepler magnitude reference link |

---

## Discovery Method Flags

| Column | Description |
|--------|-------------|
| `ttv_flag` | Transit Timing Variation flag (0 = no, 1 = yes) |
| `ptv_flag` | Transit Photometry Variation flag |
| `tran_flag` | Transit flag (0 = no, 1 = yes) |
| `rv_flag` | Radial Velocity flag (0 = no, 1 = yes) |
| `ast_flag` | Astrometry flag (0 = no, 1 = yes) |
| `obm_flag` | Orbital Brightness Modulation flag |
| `micro_flag` | Microlensing flag (0 = no, 1 = yes) |
| `etv_flag` | Eclipse Timing Variations flag |
| `ima_flag` | Imaging flag (0 = no, 1 = yes) |
| `pul_flag` | Pulsar Timing flag (0 = no, 1 = yes) |
| `dkin_flag` | Disk Kinematics flag |

---

## Observation Counts

| Column | Description |
|--------|-------------|
| `st_nphot` | Number of photometry time series |
| `st_nrvc` | Number of radial velocity time series |
| `st_nspec` | Number of stellar spectra |
| `pl_nespec` | Number of emission spectra |
| `pl_ntranspec` | Number of transmission spectra |
| `pl_ndispec` | Number of direct imaging spectra |
| `pl_nnotes` | Number of notes |

---

## Miscellaneous

| Column | Description |
|--------|-------------|
| `pl_controv_flag` | Controversial flag (0 = no controversy, 1 = controversial) |
| `pl_pubdate` | Planet publication date |
| `cb_flag` | Circumbinary flag (0 = no, 1 = yes) |

---

## Spatial Position (3D Cartesian)

| Column | Description |
|--------|-------------|
| `x` | X coordinate in 3D space |
| `y` | Y coordinate in 3D space |
| `z` | Z coordinate in 3D space |
| `htm20` | Hierarchical Triangular Mesh index (level 20) |

---

## Catalog Cross-References

| Column | Description |
|--------|-------------|
| `gaia_dr2_id` | Gaia Data Release 2 source ID |
| `gaia_dr3_id` | Gaia Data Release 3 source ID |

---

## Notes

- **Error Columns**: Most measured parameters have associated error columns (`*err1` for upper error, `*err2` for lower error)
- **Symmetric Error Flag** (`*symerr`): Indicates if errors are symmetric (1) or asymmetric (0)
- **Limit Flag** (`*lim`): Indicates if the value is an upper/lower limit rather than a measurement
- **String Columns** (`*str`): Human-readable formatted versions of values
- **Format Columns** (`*format`): Display format specifications
- **Solution ID** (`*_solnid`): Identifier for the specific solution/measurement set
- **Reference Link** (`*_reflink`): Link to the source publication or data reference

---

*Data sourced from the NASA Exoplanet Archive (https://exoplanetarchive.ipac.caltech.edu/)*

