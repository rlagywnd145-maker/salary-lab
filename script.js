// ======================================================
// 월급연구소 - script.js
// 2026 급여 / 퇴직금 / 주휴수당 / 연장·야간수당 계산
// ======================================================


// ======================================================
// 1. 근로소득 간이세액표 불러오기
// ======================================================

let taxTableStatus = "loading";

(function loadTaxTable() {

  const script = document.createElement("script");

  script.src =
    "https://cdn.jsdelivr.net/gh/min5toneko-debug/NetCalculatorWeb@main/js/taxTable.js";

  script.onload = function () {

    try {

      if (
        typeof TAX_TABLE !== "undefined" &&
        typeof TAX_TABLE_HIGH !== "undefined"
      ) {

        taxTableStatus = "ready";
        console.log("근로소득 간이세액표 로딩 완료");

      } else {

        taxTableStatus = "error";
        console.error("간이세액표 변수를 찾을 수 없습니다.");
      }

    } catch (error) {

      taxTableStatus = "error";
      console.error(error);
    }
  };


  script.onerror = function () {

    taxTableStatus = "error";
    console.error("근로소득 간이세액표를 불러오지 못했습니다.");
  };


  document.head.appendChild(script);

})();


// ======================================================
// 2. 공통 함수
// ======================================================

function getMoneyValue(id) {

  const element = document.getElementById(id);

  if (!element) {
    return 0;
  }

  const value =
    String(element.value || "")
      .replace(/,/g, "")
      .replace(/[^\d.-]/g, "");

  return Number(value) || 0;
}


function money(value) {

  return Math.round(
    Number(value) || 0
  ).toLocaleString("ko-KR");
}


function formatSalary(input) {

  let value =
    String(input.value || "")
      .replace(/[^\d]/g, "");

  if (!value) {

    input.value = "";
    return;
  }

  input.value =
    Number(value).toLocaleString("ko-KR");
}


function floorTo10(value) {

  return Math.floor(
    (Number(value) || 0) / 10
  ) * 10;
}


function clamp(value, min, max) {

  return Math.min(
    Math.max(value, min),
    max
  );
}


function taxTableNumber(value) {

  if (typeof value === "number") {
    return value;
  }

  return Number(
    String(value || "")
      .replace(/,/g, "")
  ) || 0;
}


// ======================================================
// 3. 근로소득 간이세액표 조회
// ======================================================

function lookupIncomeTaxBase(
  monthlyTaxablePay,
  familyCount
) {

  if (monthlyTaxablePay <= 0) {
    return 0;
  }


  if (taxTableStatus !== "ready") {
    return null;
  }


  const family =
    clamp(
      Math.floor(familyCount || 1),
      1,
      11
    );


  const salaryWon =
    Math.floor(monthlyTaxablePay);


  const salaryThousand =
    Math.floor(
      salaryWon / 1000
    );


  if (salaryThousand < 770) {
    return 0;
  }


  if (salaryWon < 10000000) {

    let left = 0;
    let right = TAX_TABLE.length - 1;


    while (left <= right) {

      const middle =
        Math.floor(
          (left + right) / 2
        );


      const row =
        TAX_TABLE[middle];


      const lower =
        taxTableNumber(row[0]);


      const nextLower =
        middle + 1 < TAX_TABLE.length
          ? taxTableNumber(TAX_TABLE[middle + 1][0])
          : 10000;


      if (
        salaryThousand >= lower &&
        salaryThousand < nextLower
      ) {

        return taxTableNumber(
          row[family + 1]
        );
      }


      if (salaryThousand < lower) {

        right = middle - 1;

      } else {

        left = middle + 1;
      }
    }


    return 0;
  }


  const baseTax =
    taxTableNumber(
      TAX_TABLE_HIGH[family + 1]
    );


  const excess =
    salaryWon - 10000000;


  let tax = baseTax;


  if (salaryWon <= 14000000) {

    tax =
      baseTax +
      excess * 0.98 * 0.35 +
      25000;

  } else if (salaryWon <= 28000000) {

    tax =
      baseTax +
      1397000 +
      (salaryWon - 14000000) *
      0.98 *
      0.38;

  } else if (salaryWon <= 30000000) {

    tax =
      baseTax +
      6610600 +
      (salaryWon - 28000000) *
      0.98 *
      0.40;

  } else if (salaryWon <= 45000000) {

    tax =
      baseTax +
      7394600 +
      (salaryWon - 30000000) *
      0.40;

  } else if (salaryWon <= 87000000) {

    tax =
      baseTax +
      13394600 +
      (salaryWon - 45000000) *
      0.42;

  } else {

    tax =
      baseTax +
      31034600 +
      (salaryWon - 87000000) *
      0.45;
  }


  return Math.max(
    0,
    Math.floor(tax)
  );
}


// ======================================================
// 4. 소득세 계산
// ======================================================

function calculateIncomeTax(
  monthlyTaxablePay,
  familyCount,
  childCount,
  taxRateOption
) {

  let incomeTax =
    lookupIncomeTaxBase(
      monthlyTaxablePay,
      familyCount
    );


  if (incomeTax === null) {
    return null;
  }


  const children =
    Math.max(
      0,
      Math.floor(childCount || 0)
    );


  let childDeduction = 0;


  if (children === 1) {

    childDeduction = 12500;

  } else if (children === 2) {

    childDeduction = 29160;

  } else if (children >= 3) {

    childDeduction =
      29160 +
      (children - 2) *
      25000;
  }


  incomeTax =
    Math.max(
      0,
      incomeTax - childDeduction
    );


  incomeTax *=
    Number(taxRateOption) || 1;


  return floorTo10(incomeTax);
}


// ======================================================
// 5. 월급 계산기
// ======================================================

function calculateSalary() {

  const basicSalary =
    getMoneyValue("salary");

  const nonTaxablePay =
    getMoneyValue("nonTaxablePay");

  const hours =
    Number(
      document.getElementById("hours").value
    );

  const days =
    Number(
      document.getElementById("days").value
    );

  const weeklyPayOption =
    document.getElementById("weeklyPay").value;

  const overtime =
    Number(
      document.getElementById("overtime").value
    ) || 0;

  const night =
    Number(
      document.getElementById("night").value
    ) || 0;

  const familyCount =
    Number(
      document.getElementById("familyCount").value
    ) || 1;

  const childCount =
    Number(
      document.getElementById("childCount").value
    ) || 0;

  const taxRateOption =
    Number(
      document.getElementById("taxRateOption").value
    ) || 1;

  const result =
    document.getElementById("result");


  if (
    basicSalary <= 0 ||
    hours <= 0 ||
    days <= 0
  ) {

    result.innerHTML =
      "⚠️ 기본급, 하루 근무시간, 주 근무일수를 입력해주세요.";

    return;
  }


  if (taxTableStatus === "loading") {

    result.innerHTML =
      "⏳ 세금 자료를 불러오는 중입니다. 잠시 후 다시 계산해주세요.";

    return;
  }


  if (taxTableStatus === "error") {

    result.innerHTML =
      "⚠️ 근로소득 간이세액표를 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 새로고침해주세요.";

    return;
  }


  const weeksPerMonth =
    365 / 7 / 12;


  const weeklyWorkHours =
    hours * days;


  const basicMonthlyHours =
    weeklyWorkHours *
    weeksPerMonth;


  let weeklyHolidayHours = 0;


  if (weeklyWorkHours >= 15) {

    if (weeklyWorkHours >= 40) {

      weeklyHolidayHours = 8;

    } else {

      weeklyHolidayHours =
        weeklyWorkHours / 40 * 8;
    }
  }


  const monthlyHolidayHours =
    weeklyHolidayHours *
    weeksPerMonth;


  let hourlyWage = 0;
  let weeklyHolidayPay = 0;


  if (weeklyPayOption === "yes") {

    const paidMonthlyHours =
      basicMonthlyHours +
      monthlyHolidayHours;

    hourlyWage =
      basicSalary /
      paidMonthlyHours;

  } else {

    hourlyWage =
      basicSalary /
      basicMonthlyHours;

    weeklyHolidayPay =
      hourlyWage *
      monthlyHolidayHours;
  }


  const overtimePay =
    hourlyWage *
    overtime *
    1.5;


  const nightExtraPay =
    hourlyWage *
    night *
    0.5;


  const grossSalary =
    basicSalary +
    weeklyHolidayPay +
    overtimePay +
    nightExtraPay;


  const safeNonTaxable =
    Math.min(
      Math.max(nonTaxablePay, 0),
      grossSalary
    );


  const taxablePay =
    Math.max(
      0,
      grossSalary -
      safeNonTaxable
    );


  let pensionBase =
    Math.floor(
      taxablePay / 1000
    ) * 1000;


  pensionBase =
    clamp(
      pensionBase,
      410000,
      6590000
    );


  const pension =
    taxablePay > 0
      ? floorTo10(
          pensionBase *
          0.0475
        )
      : 0;


  const healthInsurance =
    floorTo10(
      taxablePay *
      0.03595
    );


  const longTermCare =
    floorTo10(
      healthInsurance *
      0.1314
    );


  const employmentInsurance =
    floorTo10(
      taxablePay *
      0.009
    );


  const incomeTax =
    calculateIncomeTax(
      taxablePay,
      familyCount,
      childCount,
      taxRateOption
    );


  if (incomeTax === null) {

    result.innerHTML =
      "⚠️ 세금표를 아직 불러오지 못했습니다. 잠시 후 다시 계산해주세요.";

    return;
  }


  const localIncomeTax =
    floorTo10(
      incomeTax * 0.10
    );


  const totalDeduction =
    pension +
    healthInsurance +
    longTermCare +
    employmentInsurance +
    incomeTax +
    localIncomeTax;


  const netSalary =
    grossSalary -
    totalDeduction;


  const deductionRate =
    grossSalary > 0
      ? (
          totalDeduction /
          grossSalary *
          100
        ).toFixed(1)
      : "0.0";


  const dailyWage =
    hourlyWage *
    hours;


  result.innerHTML = `

    <div class="result-title">
      💰 예상 월급 분석
    </div>

    <div class="main-result-card">

      <span>예상 실수령액</span>

      <strong>
        ${money(netSalary)}원
      </strong>

    </div>

    <div class="result-grid">

      <div class="result-card">
        <span>예상 시급</span>
        <strong>${money(hourlyWage)}원</strong>
      </div>

      <div class="result-card">
        <span>예상 일급</span>
        <strong>${money(dailyWage)}원</strong>
      </div>

      <div class="result-card">
        <span>연장근로수당</span>
        <strong>${money(overtimePay)}원</strong>
      </div>

      <div class="result-card">
        <span>야간근로 가산액</span>
        <strong>${money(nightExtraPay)}원</strong>
      </div>

    </div>

    <div class="salary-summary">

      <p>
        기본급
        <strong>${money(basicSalary)}원</strong>
      </p>

      <p>
        주휴수당
        <strong>${money(weeklyHolidayPay)}원</strong>
      </p>

      <p>
        총급여
        <strong>${money(grossSalary)}원</strong>
      </p>

      <p>
        비과세 급여
        <strong>${money(safeNonTaxable)}원</strong>
      </p>

      <p>
        과세대상 급여
        <strong>${money(taxablePay)}원</strong>
      </p>

      <p>
        총 공제율
        <strong>${deductionRate}%</strong>
      </p>

    </div>

    <div class="deduction-detail">

      <div class="quick-title">
        🧾 예상 공제내역
      </div>

      <p>
        국민연금
        <strong>${money(pension)}원</strong>
      </p>

      <p>
        건강보험
        <strong>${money(healthInsurance)}원</strong>
      </p>

      <p>
        장기요양보험
        <strong>${money(longTermCare)}원</strong>
      </p>

      <p>
        고용보험
        <strong>${money(employmentInsurance)}원</strong>
      </p>

      <p>
        소득세
        <strong>${money(incomeTax)}원</strong>
      </p>

      <p>
        지방소득세
        <strong>${money(localIncomeTax)}원</strong>
      </p>

      <p>
        총 공제액
        <strong>${money(totalDeduction)}원</strong>
      </p>

    </div>

    <div class="quick-analysis">

      <div class="quick-title">
        📊 계산 기준
      </div>

      <p>
        주 근로시간
        <strong>${weeklyWorkHours.toFixed(1)}시간</strong>
      </p>

      <p>
        주휴시간
        <strong>${weeklyHolidayHours.toFixed(1)}시간</strong>
      </p>

      <p>
        공제대상 가족
        <strong>${familyCount}명</strong>
      </p>

      <p>
        8세~20세 자녀
        <strong>${childCount}명</strong>
      </p>

      <p>
        소득세 원천징수
        <strong>${Math.round(taxRateOption * 100)}%</strong>
      </p>

    </div>

    <div class="result-notice">

      ※ 2026년 보험료율과 근로소득 간이세액표를 기준으로 한 예상 계산입니다.

      <br><br>

      ※ 실제 급여는 회사의 급여 산정방식,
      비과세 항목, 부양가족, 근로조건 등에 따라 달라질 수 있습니다.

    </div>
  `;
}


// ======================================================
// 6. 퇴직금 계산기
// ======================================================

function calculateRetirementPay() {

  const startDateValue =
    document.getElementById("startDate").value;

  const lastWorkDateValue =
    document.getElementById("lastWorkDate").value;

  const threeMonthSalary =
    getMoneyValue("threeMonthSalary");

  const ordinaryDailyWage =
    getMoneyValue("ordinaryDailyWage");

  const retirementWeeklyHours =
    Number(
      document.getElementById("retirementWeeklyHours").value
    );

  const result =
    document.getElementById("retirementResult");


  if (
    !startDateValue ||
    !lastWorkDateValue ||
    threeMonthSalary <= 0 ||
    retirementWeeklyHours <= 0
  ) {

    result.innerHTML =
      "⚠️ 입사일, 마지막 근무일, 3개월 임금총액, 주 소정근로시간을 입력해주세요.";

    return;
  }


  const startDate =
    new Date(startDateValue + "T00:00:00");

  const lastWorkDate =
    new Date(lastWorkDateValue + "T00:00:00");


  if (lastWorkDate < startDate) {

    result.innerHTML =
      "⚠️ 마지막 근무일은 입사일보다 뒤여야 합니다.";

    return;
  }


  const oneDay =
    1000 * 60 * 60 * 24;


  const retirementDate =
    new Date(lastWorkDate);

  retirementDate.setDate(
    retirementDate.getDate() + 1
  );


  const serviceDays =
    Math.round(
      (retirementDate - startDate) /
      oneDay
    );


  if (serviceDays < 365) {

    result.innerHTML = `

      <div class="result-title">
        🏦 퇴직금 계산 결과
      </div>

      <div class="main-result-card">

        <span>계속근로기간</span>

        <strong>
          ${serviceDays.toLocaleString()}일
        </strong>

      </div>

      <div class="result-notice">
        계속근로기간이 1년 미만인 경우
        일반적으로 법정 퇴직금 지급 대상이 아닙니다.
      </div>
    `;

    return;
  }


  if (retirementWeeklyHours < 15) {

    result.innerHTML = `

      <div class="result-title">
        🏦 퇴직금 계산 결과
      </div>

      <div class="main-result-card">

        <span>4주 평균 주 소정근로시간</span>

        <strong>
          ${retirementWeeklyHours.toFixed(1)}시간
        </strong>

      </div>

      <div class="result-notice">
        4주 평균 주 소정근로시간이
        15시간 미만인 기간은
        법정 퇴직금 산정에서 제외될 수 있습니다.
      </div>
    `;

    return;
  }


  const averagePeriodStart =
    new Date(retirementDate);

  averagePeriodStart.setMonth(
    averagePeriodStart.getMonth() - 3
  );


  const averagePeriodDays =
    Math.round(
      (retirementDate - averagePeriodStart) /
      oneDay
    );


  const averageDailyWage =
    threeMonthSalary /
    averagePeriodDays;


  let appliedDailyWage =
    averageDailyWage;

  let wageType =
    "평균임금";


  if (
    ordinaryDailyWage > 0 &&
    ordinaryDailyWage > averageDailyWage
  ) {

    appliedDailyWage =
      ordinaryDailyWage;

    wageType =
      "통상임금";
  }


  const retirementPay =
    appliedDailyWage *
    30 *
    (serviceDays / 365);


  const serviceYears =
    serviceDays / 365;


  const averagePeriodEnd =
    new Date(retirementDate);

  averagePeriodEnd.setDate(
    averagePeriodEnd.getDate() - 1
  );


  const retirementDateText =
    retirementDate.toLocaleDateString("ko-KR");

  const averageStartText =
    averagePeriodStart.toLocaleDateString("ko-KR");

  const averageEndText =
    averagePeriodEnd.toLocaleDateString("ko-KR");


  result.innerHTML = `

    <div class="result-title">
      🏦 예상 퇴직금
    </div>

    <div class="main-result-card">

      <span>예상 퇴직금</span>

      <strong>
        ${money(retirementPay)}원
      </strong>

    </div>

    <div class="quick-analysis">

      <div class="quick-title">
        📊 퇴직금 한눈에 보기
      </div>

      <p>
        계속근로기간
        <strong>
          ${serviceDays.toLocaleString()}일
        </strong>
      </p>

      <p>
        근속기간
        <strong>
          ${serviceYears.toFixed(2)}년
        </strong>
      </p>

      <p>
        퇴직일
        <strong>
          ${retirementDateText}
        </strong>
      </p>

      <p>
        평균임금 산정기간
        <strong>
          ${averageStartText} ~ ${averageEndText}
        </strong>
      </p>

    </div>

    <div class="salary-summary">

      <p>
        직전 3개월 총 일수
        <strong>
          ${averagePeriodDays}일
        </strong>
      </p>

      <p>
        직전 3개월 임금총액
        <strong>
          ${money(threeMonthSalary)}원
        </strong>
      </p>

      <p>
        1일 평균임금
        <strong>
          ${money(averageDailyWage)}원
        </strong>
      </p>

      <p>
        입력한 1일 통상임금
        <strong>
          ${
            ordinaryDailyWage > 0
              ? money(ordinaryDailyWage) + "원"
              : "미입력"
          }
        </strong>
      </p>

      <p>
        퇴직금 적용임금
        <strong>
          ${wageType} ${money(appliedDailyWage)}원
        </strong>
      </p>

    </div>

    <div class="result-notice">

      ※ 퇴직일은 마지막 근무일의 다음 날을 기준으로 계산합니다.

      <br><br>

      ※ 퇴직 전 3개월의 총 일수는
      입력한 마지막 근무일을 기준으로 자동 계산됩니다.

      <br><br>

      ※ 입력한 1일 통상임금이 평균임금보다 높은 경우
      통상임금을 적용해 계산합니다.

      <br><br>

      ※ 실제 퇴직금은 상여금,
      연차수당, 평균임금 산입범위,
      제외기간 등에 따라 달라질 수 있습니다.

    </div>
  `;
}


// ======================================================
// 7. 주휴수당 계산기
// ======================================================

function calculateWeeklyPay() {

  const hourlyWage =
    getMoneyValue("weeklyHourlyWage");

  const dailyHours =
    Number(
      document.getElementById("weeklyHours").value
    );

  const workDays =
    Number(
      document.getElementById("weeklyDays").value
    );

  const result =
    document.getElementById("weeklyResult");


  if (
    hourlyWage <= 0 ||
    dailyHours <= 0 ||
    workDays <= 0
  ) {

    result.innerHTML =
      "⚠️ 시급과 근무시간을 입력해주세요.";

    return;
  }


  const weeklyHours =
    dailyHours *
    workDays;


  if (weeklyHours < 15) {

    result.innerHTML = `

      <div class="result-title">
        📅 예상 주휴수당
      </div>

      <div class="main-result-card">

        <span>예상 주휴수당</span>

        <strong>0원</strong>

      </div>

      <div class="result-notice">

        주 소정근로시간이 15시간 미만인 경우
        일반적으로 주휴수당 대상이 아닙니다.

      </div>
    `;

    return;
  }


  let weeklyHolidayHours;


  if (weeklyHours >= 40) {

    weeklyHolidayHours = 8;

  } else {

    weeklyHolidayHours =
      weeklyHours /
      40 *
      8;
  }


  const weeklyHolidayPay =
    hourlyWage *
    weeklyHolidayHours;


  const monthlyHolidayPay =
    weeklyHolidayPay *
    (365 / 7 / 12);


  result.innerHTML = `

    <div class="result-title">
      📅 예상 주휴수당
    </div>

    <div class="main-result-card">

      <span>1주 예상 주휴수당</span>

      <strong>
        ${money(weeklyHolidayPay)}원
      </strong>

    </div>

    <div class="salary-summary">

      <p>
        주 근로시간
        <strong>
          ${weeklyHours.toFixed(1)}시간
        </strong>
      </p>

      <p>
        주휴시간
        <strong>
          ${weeklyHolidayHours.toFixed(1)}시간
        </strong>
      </p>

      <p>
        월 환산 주휴수당
        <strong>
          ${money(monthlyHolidayPay)}원
        </strong>
      </p>

    </div>

    <div class="result-notice">

      ※ 소정근로일을 개근했다는 가정으로 계산한 예상값입니다.

      <br><br>

      ※ 실제 지급 여부는 근로계약과 근무조건에 따라 달라질 수 있습니다.

    </div>
  `;
}


// ======================================================
// 8. 연장·야간수당 계산기
// ======================================================

function calculateExtraPay() {

  const hourlyWage =
    getMoneyValue("extraHourlyWage");


  const workplaceSize =
    document.getElementById("workplaceSize").value;


  const overtimeHours =
    Number(
      document.getElementById("extraOvertimeHours").value
    ) || 0;


  const nightHours =
    Number(
      document.getElementById("extraNightHours").value
    ) || 0;


  const overlapHours =
    Number(
      document.getElementById("overlapHours").value
    ) || 0;


  const result =
    document.getElementById("extraPayResult");


  if (hourlyWage <= 0) {

    result.innerHTML =
      "⚠️ 통상시급을 입력해주세요.";

    return;
  }


  if (
    overtimeHours < 0 ||
    nightHours < 0 ||
    overlapHours < 0
  ) {

    result.innerHTML =
      "⚠️ 근무시간은 0시간 이상으로 입력해주세요.";

    return;
  }


  if (
    overlapHours > overtimeHours ||
    overlapHours > nightHours
  ) {

    result.innerHTML =
      "⚠️ 중복시간은 연장근무시간과 야간근무시간보다 클 수 없습니다.";

    return;
  }


  let overtimePay = 0;
  let nightExtraPay = 0;
  let overlapNightPremium = 0;
  let totalExtraPay = 0;


  // --------------------------------------------------
  // 상시근로자 5인 이상
  // --------------------------------------------------

  if (workplaceSize === "5plus") {

    overtimePay =
      hourlyWage *
      overtimeHours *
      1.5;


    const nightOnlyHours =
      Math.max(
        0,
        nightHours - overlapHours
      );


    nightExtraPay =
      hourlyWage *
      nightOnlyHours *
      0.5;


    overlapNightPremium =
      hourlyWage *
      overlapHours *
      0.5;


    totalExtraPay =
      overtimePay +
      nightExtraPay +
      overlapNightPremium;


  // --------------------------------------------------
  // 상시근로자 5인 미만
  // --------------------------------------------------

  } else {

    overtimePay =
      hourlyWage *
      overtimeHours;


    nightExtraPay = 0;
    overlapNightPremium = 0;


    totalExtraPay =
      overtimePay;
  }


  result.innerHTML = `

    <div class="result-title">
      🌙 예상 추가수당
    </div>


    <div class="main-result-card">

      <span>
        예상 추가수당 합계
      </span>

      <strong>
        ${money(totalExtraPay)}원
      </strong>

    </div>


    <div class="salary-summary">

      <p>
        사업장 기준
        <strong>
          ${
            workplaceSize === "5plus"
              ? "상시근로자 5인 이상"
              : "상시근로자 5인 미만"
          }
        </strong>
      </p>


      <p>
        연장근무시간
        <strong>
          ${overtimeHours.toFixed(1)}시간
        </strong>
      </p>


      <p>
        야간근무시간
        <strong>
          ${nightHours.toFixed(1)}시간
        </strong>
      </p>


      <p>
        연장·야간 중복시간
        <strong>
          ${overlapHours.toFixed(1)}시간
        </strong>
      </p>


      <p>
        연장근로 계산액
        <strong>
          ${money(overtimePay)}원
        </strong>
      </p>


      <p>
        야간근로 가산액
        <strong>
          ${money(nightExtraPay)}원
        </strong>
      </p>


      ${
        workplaceSize === "5plus"
          ? `
            <p>
              연장·야간 중복 가산액
              <strong>
                ${money(overlapNightPremium)}원
              </strong>
            </p>
          `
          : ""
      }


      <p>
        추가수당 합계
        <strong>
          ${money(totalExtraPay)}원
        </strong>
      </p>

    </div>


    <div class="result-notice">

      ${
        workplaceSize === "5plus"
          ? `
            ※ 상시근로자 5인 이상 사업장을 기준으로
            연장근로는 통상시급의 1.5배,
            야간근로는 0.5배 가산하여 계산했습니다.

            <br><br>

            ※ 연장근로와 야간근로가 겹치는 시간에는
            연장근로 계산액에 야간 가산 0.5배를 추가했습니다.
          `
          : `
            ※ 상시근로자 5인 미만 사업장은
            연장·야간 가산수당 적용 기준이 달라질 수 있어
            입력한 연장근로시간의 기본임금을 중심으로 계산했습니다.
          `
      }

      <br><br>

      ※ 실제 수당은 휴일근로 여부,
      통상임금 범위, 근로계약,
      사업장 조건 등에 따라 달라질 수 있습니다.

    </div>
  `;
}
// 날짜 8자리 입력 시 YYYY-MM-DD 형식으로 자동 변환
function formatDateInput(input) {
  let value = input.value.replace(/\D/g, "").slice(0, 8);

  if (value.length >= 5) {
    value = value.slice(0, 4) + "-" + value.slice(4);
  }

  if (value.length >= 8) {
    value = value.slice(0, 7) + "-" + value.slice(7);
  }

  input.value = value;
}

document.getElementById("startDate").addEventListener("input", function () {
  formatDateInput(this);
});

document.getElementById("lastWorkDate").addEventListener("input", function () {
  formatDateInput(this);
});
