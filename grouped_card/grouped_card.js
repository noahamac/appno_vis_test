import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import {formatType, lighten} from '../common'

const DataPointsWrapper = styled.div`
  font-family: ${props => props.font ? `${props.font}, sans-serif` : `'Open Sans', 'Noto Sans JP', 'Noto Sans', 'Noto Sans CJK KR', Helvetica, Arial, sans-serif`};
  display: flex;
  flex-direction: ${props => props.layout === 'horizontal' ? 'row' : 'column'};
  align-items: center;
  justify-content: space-around;
  margin: 10px;
  height: 100%;
`

const dataPointGroupDirectionDict = {
  'below': 'column',
  'above': 'column-reverse',
  'left': 'row-reverse',
  'right': 'row'
}

const DataPointGroup = styled.div`
  margin: 20px 5px;
  text-align: center;
  width: 100%;
  display: flex;
  flex-direction: ${props => props.comparisonPlacement ? dataPointGroupDirectionDict[props.comparisonPlacement] : 'column'};
  align-items: center;
  justify-content: center;
`

const DataPoint = styled.div`
  display: flex;
  flex-direction: ${props => props.titlePlacement === 'above' ? 'column' : 'column-reverse'};
  flex: 1;
`

const DataPointTitle = styled.div`
  font-weight: 100;
  color: rgba(58,66,69,0.65);
  margin: 5px 0;
`

const DataPointValue = styled.div`
  font-size: 3em;
  color: ${props => props.color};

  a.drillable-link {
    color: ${props => props.color};
    text-decoration: none;
  }
  a.drillable-link:hover {
    text-decoration: underline;
  }
`

const ComparisonDataPoint = styled.div`
  flex: 1;
  width: 100%;

  margin: 10px 0;
  
  font-size: 0.9em;
  font-weight: 100;
  color: #a5a6a1;

  a.drillable-link {
    color: #a5a6a1;
    text-decoration: none;
  }
  a.drillable-link:hover {
    text-decoration: underline;
  }
`

const UpArrow = styled.div`
  display: inline-block;
  width: 0; 
  height: 0; 
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 10px solid green;
  margin-right: 5px;
`
const DownArrow = styled.div`
  display: inline-block;  
  width: 0; 
  height: 0; 
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 10px solid #f00;
  margin-right: 5px;
`
const ComparisonPercentageChange = styled.div`
  display: inline-block;
  color: ${props => props.value >= 0 ? 'green' : 'red'}
  padding-right: 5px;
`
const ComparisonSimpleValue = styled.div`
  font-weight: 100;
  display: inline-block;
  padding-right: 5px;
`
const ComparisonProgressBar = styled.div`
  position: relative;
  background-color: ${props => props.background[0] ? lighten(props.background[0], 20) : '#a5a6a1'};
  height: 40px;
  text-align: center;
`

const ComparisonProgressBarFilled = styled.div`
  background-color: ${props => props.background[0] || '#656664'};
  width: ${props => props.percentage || 0}%;
  height: 40px;
`

const ComparisonProgressBarLabel = styled.div`
  position: absolute;
  top: 0;
  width: 100%;
  height: 40px;
  text-align: center;
  line-height: 40px;  
  color: #000000;

  a.drillable-link {
    color: #000000;
  }
`;

class GroupedCard extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {}
    this.state.groupingLayout = 'horizontal';
    this.state.fontSize = this.calculateFontSize();
  }

  componentDidMount() {
    window.addEventListener('resize', this.recalculateSizing);
  }

  componentDidUpdate() {
    this.recalculateSizing();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.recalculateSizing);
  }

  getWindowSize = () => {
    return window.innerWidth > window.innerHeight ? window.innerWidth : window.innerHeight;
  }

  calculateFontSize = () => {
    const multiplier = this.state.groupingLayout === 'horizontal' ? 0.015 : 0.02;
    return Math.round(this.getWindowSize() * multiplier);
  }

  recalculateSizing = () => {
    const groupingLayout = window.innerWidth >= 768 ? 'horizontal' : 'vertical'; 
    this.setState({
      fontSize: this.calculateFontSize(),
      groupingLayout
    })
  }

  render() {
    const {config, data} = this.props;

    return (
      <DataPointsWrapper
        layout={this.state.groupingLayout}
        font={config['grouping_font']}
        style={{fontSize: `${this.state.fontSize}px`}}
      >
        {data
          .map((dataPoint, index) => {
            const compDataPoint = dataPoint.comparison
            let progressPerc
            let percChange
            if (compDataPoint) {
              progressPerc = Math.round((dataPoint.value / compDataPoint.value) * 100)
              percChange = progressPerc - 100
              progressPerc = progressPerc > 100 ? 100 : progressPerc
            }
            return (
              <DataPointGroup comparisonPlacement={compDataPoint && config[`comparison_label_placement_${compDataPoint.name}`]} key={`group_${dataPoint.name}`}>
                <DataPoint titlePlacement={config[`title_placement_${dataPoint.name}`]}>
                  {config[`show_tile_${dataPoint.name}`] === false ? null : (
                    <DataPointTitle>
                      {config[`title_overrride_${dataPoint.name}`] || dataPoint.label}
                    </DataPointTitle>
                  )}
                  <DataPointValue color={config[`style_${dataPoint.name}`]}>
                    {dataPoint.formattedValue}
                  </DataPointValue>
                </DataPoint>

                {!compDataPoint ? null : (
                  <ComparisonDataPoint>
                    {config[`comparison_style_${compDataPoint.name}`] !== 'percentage_change' ? null : (
                      <ComparisonPercentageChange value={percChange}>
                        {percChange >= 0 ? <UpArrow /> : <DownArrow />}
                        {percChange >= 0 ? `+${percChange}` : percChange}%
                      </ComparisonPercentageChange>
                    )}
                    {config[`comparison_style_${compDataPoint.name}`] !== 'value' ? null : <ComparisonSimpleValue>{compDataPoint.formattedValue}</ComparisonSimpleValue>}
                    {config[`comparison_style_${compDataPoint.name}`] !== 'calculate_progress' &&
                    config[`comparison_style_${compDataPoint.name}`] !== 'calculate_progress_perc' ? null : (
                      <ComparisonProgressBar background={config[`style_${dataPoint.name}`]}>
                        <ComparisonProgressBarFilled
                          background={config[`style_${dataPoint.name}`]}
                          percentage={progressPerc}
                        />
                          {config[`comparison_show_label_${compDataPoint.name}`] === false ? null : (
                            <ComparisonProgressBarLabel>
                              {config[`comparison_style_${compDataPoint.name}`] === 'calculate_progress' ? null :
                                <React.Fragment>
                                  {`${progressPerc}% of `}
                                  {compDataPoint.formattedValue}
                                </React.Fragment>
                              }
                              &nbsp;
                              {config[`comparison_label_${compDataPoint.name}`] || compDataPoint.label}
                            </ComparisonProgressBarLabel>
                          )}
                      </ComparisonProgressBar>
                    )}
                    {(
                      config[`comparison_show_label_${compDataPoint.name}`] === false ||
                      config[`comparison_style_${compDataPoint.name}`] === 'calculate_progress' ||
                      config[`comparison_style_${compDataPoint.name}`] === 'calculate_progress_perc')
                    ? null 
                      : config[`comparison_label_${compDataPoint.name}`] || compDataPoint.label}
                  </ComparisonDataPoint>
                )}
              </DataPointGroup>  
            )
          })
        }
      </DataPointsWrapper>
    )
  }
}

GroupedCard.propTypes = {
  config: PropTypes.object,
  data: PropTypes.array,
};

export default GroupedCard;
