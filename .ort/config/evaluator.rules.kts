// Policy rules for the ORT evaluator, read by .github/workflows/licenses.yml.
// https://oss-review-toolkit.org/ort/docs/configuration/evaluator-rules
//
// The license check follows ORT's OSADL rule, which rates every license against the OSADL compatibility matrix:
// https://github.com/oss-review-toolkit/ort/blob/94.2.0/evaluator/src/main/resources/rules/osadl.rules.kts
// Deviations are noted below. Accepted violations are recorded as resolutions in .ort.yml.

import org.ossreviewtoolkit.evaluator.osadl.Compatibility
import org.ossreviewtoolkit.evaluator.osadl.CompatibilityMatrix

val outboundLicense = "MIT"

val licenseView = LicenseView.CONCLUDED_OR_DECLARED_AND_DETECTED

// ORT's rule drops license exceptions before the lookup. The matrix rates some exceptions separately, and an unrated
// one is reported as unknown.
fun compatibilityOf(license: SpdxSingleLicenseExpression) =
    CompatibilityMatrix.getCompatibilityInfo(outboundLicense, license.toString())

fun isCompatible(license: SpdxSingleLicenseExpression) =
    compatibilityOf(license).compatibility in Compatibility.COMPATIBLE_VALUES

fun RuleSet.osadlCompatibilityRule() = packageRule("OSADL_PROJECT_LICENSE_COMPATIBILITY") {
    require {
        -isExcluded()
        -isProject()
    }

    // The effective license has the license choices from .ort.yml applied. ORT's rule checks every license of a dual
    // license, here one compatible choice is enough.
    val license = getEffectiveLicense(licenseView)?.takeIf { it.isPresent() } ?: return@packageRule

    if (license.validChoices().any { choice -> choice.decompose().all(::isCompatible) }) return@packageRule

    val dependency = pkg.metadata.id.toCoordinates()
    val howToFix = "Remove the dependency, or decide that it may be used and add a rule violation resolution to .ort.yml."

    license.decompose().filterNot(::isCompatible).forEach { inbound ->
        val info = compatibilityOf(inbound)

        when (info.compatibility) {
            Compatibility.CONTEXTUAL -> warning(
                message = "Whether the outbound license $outboundLicense is compatible with the inbound license " +
                    "$inbound of '$dependency' depends on the context. ${info.explanation}",
                howToFix = howToFix
            )

            Compatibility.UNKNOWN -> warning(
                message = "It is unknown whether the outbound license $outboundLicense is compatible with the " +
                    "inbound license $inbound of '$dependency'. ${info.explanation}",
                howToFix = howToFix
            )

            else -> error(
                message = "The outbound license $outboundLicense is incompatible with the inbound license $inbound " +
                    "of '$dependency'. ${info.explanation}",
                howToFix = howToFix
            )
        }
    }
}

// ORT's rule skips packages without a license.
fun RuleSet.missingLicenseRule() = packageRule("MISSING_LICENSE") {
    require {
        -isExcluded()
        -isProject()
        -hasLicense()
    }

    error(
        message = "No license was found for '${pkg.metadata.id.toCoordinates()}'.",
        howToFix = "Find the license and add a package curation to .ort/config/curations.yml."
    )
}

// The GitHub action ignores the exit code of the analyzer, so dependencies it could not resolve would go unchecked.
fun RuleSet.analyzerIssuesRule() = ortResultRule("ANALYZER_ISSUES") {
    ortResult.getAnalyzerIssues(omitExcluded = true, omitResolved = true, minSeverity = Severity.ERROR)
        .forEach { (id, issues) ->
            issues.forEach { issue ->
                error(
                    message = "The dependencies of ${id.toCoordinates()} could not be resolved: ${issue.message}",
                    howToFix = "Fix the build so that ORT can resolve its dependencies; its licenses are unchecked."
                )
            }
        }
}

val ruleSet = ruleSet(ortResult, licenseInfoResolver, resolutionProvider) {
    osadlCompatibilityRule()
    missingLicenseRule()
    analyzerIssuesRule()
}

ruleViolations += ruleSet.violations
