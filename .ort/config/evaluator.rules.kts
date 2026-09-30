import org.ossreviewtoolkit.evaluator.osadl.Compatibility
import org.ossreviewtoolkit.evaluator.osadl.CompatibilityMatrix

// QuaK is MIT licensed. A dependency passes if one of its license choices consists only of licenses that the OSADL
// compatibility matrix marks as compatible with MIT. Everything else fails until it is decided and recorded as a
// resolution in .ort.yml.

val outboundLicense = "MIT"

fun compatibility(license: SpdxSingleLicenseExpression) =
    CompatibilityMatrix.getCompatibilityInfo(outboundLicense, license.toString()).compatibility

fun isCompatible(license: SpdxSingleLicenseExpression) = compatibility(license) in Compatibility.COMPATIBLE_VALUES

fun RuleSet.missingLicenseRule() = packageRule("MISSING_LICENSE") {
    require {
        -isExcluded()
        -isProject()
    }

    val license = getEffectiveLicense(LicenseView.CONCLUDED_OR_DECLARED_AND_DETECTED)

    if (license == null || !license.isPresent()) {
        error(
            message = "${pkg.metadata.id.toCoordinates()} declares no license.",
            howToFix = "Find the license and add a package curation with a concluded license to .ort/config/curations.yml."
        )
    }
}

fun RuleSet.incompatibleLicenseRule() = packageRule("INCOMPATIBLE_LICENSE") {
    require {
        -isExcluded()
        -isProject()
    }

    val license = getEffectiveLicense(LicenseView.CONCLUDED_OR_DECLARED_AND_DETECTED)
        ?.takeIf { it.isPresent() }
        ?: return@packageRule

    val compatibleChoice = license.validChoices().any { choice -> choice.decompose().all(::isCompatible) }

    if (!compatibleChoice) {
        val verdicts = license.decompose()
            .filterNot(::isCompatible)
            .joinToString { "$it (${compatibility(it)})" }

        error(
            message = "${pkg.metadata.id.toCoordinates()} is licensed under $license, which is not compatible with " +
                "$outboundLicense according to the OSADL matrix: $verdicts.",
            howToFix = "Decide whether the package may be used, then add a rule violation resolution to .ort.yml."
        )
    }
}

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
    missingLicenseRule()
    incompatibleLicenseRule()
    analyzerIssuesRule()
}

ruleViolations += ruleSet.violations
